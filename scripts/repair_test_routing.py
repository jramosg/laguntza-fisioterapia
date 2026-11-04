"""Repair the test virtual host, validate Nginx and roll back on failure."""

import datetime
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HOST = "test.laguntzafisioterapia.com"
ROOT = "/var/www/laguntza-fisioterapia"
PRIMARY = Path("/etc/nginx/sites-enabled/laguntza-fisioterapia")
BACKUPS = Path("/var/backups/laguntza-nginx")


def command(*args):
    return subprocess.run(args, capture_output=True, text=True, check=True)


def names_in(text):
    clean = re.sub(r"#[^\n]*", "", text)
    return {name for group in re.findall(r"\bserver_name\s+([^;]+);", clean)
            for name in group.split()}


def active_configs():
    result = command("nginx", "-T")
    parts = re.split(r"^# configuration file (.+):\s*$", result.stdout, flags=re.M)
    for name, content in zip(parts[1::2], parts[2::2]):
        if HOST in names_in(content):
            yield Path(name).resolve(), content


def closing_brace(text, opening):
    depth = 0
    quote = None
    escaped = False
    comment = False
    for index in range(opening, len(text)):
        char = text[index]
        if comment:
            if char == "\n":
                comment = False
        elif escaped:
            escaped = False
        elif char == "\\":
            escaped = True
        elif quote:
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char == "#":
            comment = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index + 1
    raise ValueError("Unbalanced Nginx configuration")


def blocks(text, directive):
    for match in re.finditer(r"(?m)^([ \t]*)" + directive + r"[ \t]*\{", text):
        yield match.start(), closing_brace(text, match.end() - 1), match.group(1)


def repair_config(text):
    targets = []
    for start, end, _ in blocks(text, "server"):
        section = text[start:end]
        if HOST in names_in(section) and re.search(
            r"\broot\s+" + re.escape(ROOT) + r"\s*;", section
        ):
            if names_in(section) != {HOST}:
                raise ValueError("Refusing to change a virtual host shared with other domains")
            targets.append((start, end, section))
    if len(targets) != 1:
        raise ValueError("Expected exactly one static test virtual host")
    start, end, section = targets[0]
    locations = list(blocks(section, r"location\s+/"))
    if len(locations) != 1:
        raise ValueError("Expected one root location")
    loc_start, loc_end, indent = locations[0]
    location = section[loc_start:loc_end]
    pattern = r"(?m)^([ \t]*)try_files[ \t]+\$uri[ \t]+\$uri/[ \t]+(?:/index\.html|=404)[ \t]*;"
    location, count = re.subn(
        pattern, lambda match: match.group(1) + "try_files $uri $uri/ =404;", location
    )
    if count != 1:
        raise ValueError("Unexpected root fallback; refusing an ambiguous change")
    errors = re.findall(r"\berror_page\s+404\s+([^;]+);", section)
    if errors and errors != ["/404.html"]:
        raise ValueError("Unexpected existing 404 handler")
    exact = list(blocks(section, r"location\s+=\s+/404\.html"))
    if exact and (len(exact) != 1 or not re.search(
        r"\binternal\s*;", section[exact[0][0]:exact[0][1]]
    )):
        raise ValueError("Unexpected existing error-page location")
    additions = ""
    if not errors:
        additions += indent + "error_page 404 /404.html;\n\n"
    if not exact:
        additions += (indent + "location = /404.html {\n" + indent
                      + "    internal;\n" + indent + "}\n\n")
    section = section[:loc_start] + additions + location + section[loc_end:]
    return text[:start] + section + text[end:]


def atomic_write(path, content):
    original = path.stat()
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, prefix=".laguntza-", delete=False) as temp:
        temporary = Path(temp.name)
        temp.write(content)
        temp.flush()
        os.fsync(temp.fileno())
    try:
        temporary.chmod(original.st_mode & 0o7777)
        os.chown(temporary, original.st_uid, original.st_gid)
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def verify_site():
    for path, status, marker in [
        ("/es/", "200", "Laguntza"),
        ("/eu/", "200", "Laguntza"),
        ("/__routing-check-missing__/", "404", "missing-page"),
        ("/es/__routing-check-missing__/", "404", "missing-page"),
        ("/eu/__routing-check-missing__/", "404", "missing-page"),
    ]:
        for attempt in range(6):
            result = command(
                "curl", "--silent", "--show-error", "--max-time", "10", "--resolve",
                f"{HOST}:443:127.0.0.1", "--write-out", "\n%{http_code}", f"https://{HOST}{path}"
            )
            body, actual = result.stdout.rsplit("\n", 1)
            if actual == status and marker in body:
                break
            if attempt == 5:
                raise RuntimeError(f"Routing check failed: {path} returned {actual}")
            # Nginx reloads asynchronously; let the old workers finish retiring.
            time.sleep(0.25 * (attempt + 1))
        print(f"Verified {status}: {path}")


def apply_repair(configs):
    path = PRIMARY.resolve()
    if path not in configs:
        raise ValueError("The inspected primary test configuration is not active")
    if not (Path(ROOT) / "404.html").is_file():
        raise ValueError("The deployed custom 404 page is missing")
    original = path.read_text()
    revised = repair_config(original)
    duplicates = []
    for candidate, content in configs.items():
        if candidate == path:
            continue
        if (not candidate.name.startswith("laguntza-fisioterapia-backup-")
                or names_in(content) != {HOST}
                or set(re.findall(r"\broot\s+([^;]+);", content)) != {ROOT}):
            raise ValueError("Unexpected duplicate host; refusing to disable it")
        duplicates.append(candidate)
    if revised == original and not duplicates:
        command("nginx", "-t")
        verify_site()
        print("Test routing is already configured correctly")
        return
    backup = BACKUPS / datetime.datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    backup.mkdir(parents=True, mode=0o700)
    shutil.copy2(path, backup / "primary.conf")
    moved = []
    try:
        atomic_write(path, revised)
        for duplicate in duplicates:
            destination = backup / duplicate.name
            shutil.move(str(duplicate), str(destination))
            moved.append((duplicate, destination))
        command("nginx", "-t")
        command("systemctl", "reload", "nginx")
        verify_site()
    except Exception:
        atomic_write(path, original)
        for duplicate, destination in moved:
            shutil.move(str(destination), str(duplicate))
        command("nginx", "-t")
        command("systemctl", "reload", "nginx")
        print("Previous test configuration restored")
        raise
    print(f"Test routing repaired; rollback files: {backup}")


def main():
    configs = dict(active_configs())
    if not configs:
        raise SystemExit(f"No active configuration found for {HOST}")
    if sys.argv[1] == "inspect-routing":
        for path, content in configs.items():
            print(f"Test configuration: {path}")
            for line in content.splitlines():
                if re.match(r"\s*(?:server_name|root|location|try_files|error_page|listen)\b", line):
                    print(line)
    elif sys.argv[1] == "repair-routing":
        apply_repair(configs)
    else:
        raise SystemExit("Unknown operation")


if __name__ == "__main__":
    main()
