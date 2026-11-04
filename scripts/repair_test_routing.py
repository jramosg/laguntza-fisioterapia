"""Inspect and repair routing for the test site without changing other hosts."""

import re
import subprocess
import sys
from pathlib import Path

HOST = "test.laguntzafisioterapia.com"
ROOT = "/var/www/laguntza-fisioterapia"


def active_configs():
    result = subprocess.run(
        ["nginx", "-T"], capture_output=True, text=True, check=True
    )
    sections = re.split(r"^# configuration file (.+):\s*$", result.stdout, flags=re.M)
    for name, content in zip(sections[1::2], sections[2::2]):
        uncommented = re.sub(r"#[^\n]*", "", content)
        names = re.findall(r"\bserver_name\s+([^;]+);", uncommented)
        if any(HOST in names.split() for names in names):
            yield Path(name).resolve(), content


def main():
    configs = dict(active_configs())
    if len(configs) != 1:
        raise SystemExit(f"Expected one active configuration for {HOST}; found {len(configs)}")
    for path, content in configs.items():
        print(f"Test configuration: {path}")
        for line in content.splitlines():
            if re.match(r"\s*(?:server_name|root|location|try_files|error_page|listen)\b", line):
                print(line)
    if sys.argv[1] != "inspect-routing":
        raise SystemExit("Repair must be implemented after inspecting the active configuration")


if __name__ == "__main__":
    main()
