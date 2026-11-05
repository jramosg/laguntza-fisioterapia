"""Deploy an immutable Node image and static pages, rolling back failed releases."""

import datetime
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path
from html.parser import HTMLParser

TARGETS = {
    "test": ("test.laguntzafisioterapia.com", "/var/www/laguntza-fisioterapia", "/etc/nginx/sites-enabled/laguntza-fisioterapia"),
    "production": ("laguntzafisioterapia.com", "/var/www/laguntza-fisioterapia-production", "/etc/nginx/sites-enabled/laguntza-fisioterapia-production"),
}
RELEASES = Path('/var/www/laguntza-releases')
STATE = Path('/var/lib/laguntza')
CERTIFICATES = Path('/etc/letsencrypt/live')
ENVIRONMENTS = Path('/etc/laguntza')


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout


def atomic_write(path, text, mode=0o644):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as file:
        temporary = Path(file.name)
        file.write(text)
    temporary.chmod(mode)
    temporary.replace(path)


def content_security_policy(client):
    class Scripts(HTMLParser):
        def __init__(self):
            super().__init__(convert_charrefs=False)
            self.active = False
            self.body = []
            self.hashes = set()

        def handle_starttag(self, tag, attributes):
            attrs = dict(attributes)
            if tag == 'script':
                self.active = 'src' not in attrs and attrs.get('type', '').lower() in ('', 'module', 'text/javascript', 'application/javascript')
                self.body = []

        def handle_data(self, data):
            if self.active:
                self.body.append(data)

        def handle_endtag(self, tag):
            if tag == 'script' and self.active:
                digest = hashlib.sha256(''.join(self.body).encode()).digest()
                self.hashes.add("'sha256-" + base64.b64encode(digest).decode() + "'")
                self.active = False

    scripts = Scripts()
    for page in client.rglob('*.html'):
        scripts.feed(page.read_text())
    # ClientRouter, GSAP and Leaflet need dynamic inline styles; scripts do not
    # need unsafe-inline or unsafe-eval. Keep the theme bootstrap hash allowed.
    return "; ".join([
        "default-src 'self'", "base-uri 'none'", "object-src 'none'",
        "frame-ancestors 'none'", "form-action 'self'",
        "script-src 'self' " + ' '.join(sorted(scripts.hashes)),
        "script-src-attr 'none'", "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https://tile.openstreetmap.org",
        "font-src 'self'", "connect-src 'self'", "frame-src 'none'",
        "worker-src 'self' blob:", "upgrade-insecure-requests",
    ])


def render_nginx(environment, root, port, policy="default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'", mail_port=3000):
    domain = TARGETS[environment][0]
    alias = " www.laguntzafisioterapia.com" if environment == "production" else ""
    robots = 'add_header X-Robots-Tag "noindex, nofollow" always;' if environment == "test" else ""
    canonical = 'if ($host = www.laguntzafisioterapia.com) { return 301 https://laguntzafisioterapia.com$request_uri; }' if environment == "production" else ""
    # The temporary compatibility endpoint keeps the existing Netlify form working.
    # Requests without the final slash are proxied internally without a redirect.
    legacy = ""
    if environment == 'test':
        for path in ('/api/contact-form', '/api/contact-form/'):
            legacy += f"""
    location = {path} {{
        client_max_body_size 22m;
        limit_req zone=laguntza_test_actions burst=10 nodelay;
        limit_req_status 429;
        limit_conn laguntza_mail_connections 1;
        limit_conn_status 429;
        proxy_pass http://127.0.0.1:{int(mail_port)}/api/contact-form/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_read_timeout 30s;
    }}
"""
        legacy += 'location ^~ /api/ { return 404; }'
    proxy = f"""
        proxy_pass http://127.0.0.1:{int(port)};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_read_timeout 30s;
    """
    legal = ''.join(f'location = /{language}/legal/ {{ {proxy} }}\n' for language in ('es', 'eu'))
    zone = f"laguntza_{environment}_actions"
    return f"""# Managed by Laguntza deployment; environment: {environment}
limit_req_zone $binary_remote_addr zone={zone}:1m rate=10r/m;
{'limit_conn_zone $server_name zone=laguntza_mail_connections:1m;' if environment == 'test' else ''}
server {{
    listen 80;
    server_name {domain}{alias};
    return 301 https://{domain}$request_uri;
}}
server {{
    listen 443 ssl http2;
    server_name {domain}{alias};
    root {root};
    index index.html;
    ssl_certificate /etc/letsencrypt/live/{domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    {canonical}
    client_max_body_size 16m;
    client_body_timeout 15s;
    server_tokens off;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "{policy}" always;
    {robots}
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    location = / {{ {proxy} }}
    {legal}
    location ^~ /_actions/ {{
        limit_req zone={zone} burst=10 nodelay;
        limit_req_status 429;
        {proxy}
    }}
    {legacy}
    location ^~ /_astro/ {{ expires 1y; try_files $uri =404; }}
    error_page 404 /404.html;
    location = /404.html {{ internal; }}
    location / {{ expires -1; try_files $uri $uri/ =404; }}
}}
"""


def extract_client(archive, destination):
    destination.mkdir(parents=True)
    with tarfile.open(archive) as bundle:
        for member in bundle.getmembers():
            if not (member.isfile() or member.isdir()) or not (destination / member.name).resolve().is_relative_to(destination.resolve()):
                raise ValueError("Invalid static archive member")
        bundle.extractall(destination)
    for page in ("es/index.html", "eu/index.html", "404.html"):
        if not (destination / page).is_file():
            raise ValueError(f"Missing required page: {page}")
    for path in [destination, *destination.rglob("*")]:
        path.chmod(0o755 if path.is_dir() else 0o644)


def prepare_environment(environment):
    directory = ENVIRONMENTS
    directory.mkdir(mode=0o700, exist_ok=True)
    path = directory / f"{environment}.env"
    if not path.exists():
        values = {"EMAIL_ENABLED": "false"}
        if environment in ("production", "mail"):
            mail_settings = directory / 'mail.env'
            if environment == 'production' and mail_settings.exists():
                existing = dict(line.split('=', 1) for line in mail_settings.read_text().splitlines() if '=' in line)
            else:
                current = json.loads(run("docker", "inspect", "email-sender-api"))[0]
                existing = dict(item.split("=", 1) for item in current["Config"]["Env"])
            for key in ("RESEND_API_KEY", "FROM_EMAIL", "COMPANY_EMAIL", "BCC_EMAIL"):
                if existing.get(key):
                    values[key] = existing[key]
            # The old installation delivered clinic copies through BCC only.
            # Preserve those destinations rather than inventing a new mailbox.
            if not values.get('COMPANY_EMAIL') and values.get('BCC_EMAIL'):
                values['COMPANY_EMAIL'] = values.pop('BCC_EMAIL')
            if not all(values.get(key) for key in ("RESEND_API_KEY", "FROM_EMAIL", "COMPANY_EMAIL")):
                raise ValueError("The existing mail service is missing required settings")
            values["EMAIL_ENABLED"] = "true"
            values["LEGACY_CONTACT_ENABLED"] = 'true' if environment == 'mail' else 'false'
        if any("\n" in value or "\r" in value for value in values.values()):
            raise ValueError("Invalid runtime configuration")
        atomic_write(path, "".join(f"{key}={value}\n" for key, value in values.items()), 0o600)
    if environment == "test" and "EMAIL_ENABLED=false" not in path.read_text().splitlines():
        raise ValueError("Test must have EMAIL_ENABLED=false")
    if environment == 'mail' and not {'EMAIL_ENABLED=true', 'LEGACY_CONTACT_ENABLED=true'}.issubset(path.read_text().splitlines()):
        raise ValueError('Compatibility mail runtime requires explicit flags')
    return path


def wait_for_runtime(port, environment):
    last_error = None
    for _ in range(40):
        try:
            health = json.loads(run("curl", "-fsS", "--max-time", "2", f"http://127.0.0.1:{port}/health/"))
            if health["status"] == "ok" and (environment != "test" or health["emailEnabled"] is False):
                return
        except Exception as error:
            last_error = error
        time.sleep(0.25)
    raise RuntimeError("New runtime did not become healthy") from last_error


def verify_site(domain, environment):
    for path, expected, marker in [("/es/", "200", "Laguntza"), ("/eu/", "200", "Laguntza"), ("/__release-missing__/", "404", "missing-page")]:
        for attempt in range(10):
            result = run("curl", "-sS", "--max-time", "10", "--resolve", f"{domain}:443:127.0.0.1", "-w", "\n%{http_code}", f"https://{domain}{path}")
            body, status = result.rsplit("\n", 1)
            if status == expected and marker in body:
                break
            if attempt == 9:
                raise RuntimeError(f"Release check failed for {path}: HTTP {status}")
            time.sleep(0.25)
    for attempt in range(10):
        headers = run("curl", "-sS", "-D", "-", "-o", "/dev/null", "--max-time", "10", "--resolve", f"{domain}:443:127.0.0.1", "-H", "Accept-Language: eu", f"https://{domain}/").lower()
        root_valid = "location: /eu/" in headers and "no-store" in headers
        indexing_valid = True
        if environment == "test":
            headers = run("curl", "-sSI", "--max-time", "10", "--resolve", f"{domain}:443:127.0.0.1", f"https://{domain}/es/").lower()
            indexing_valid = "x-robots-tag: noindex" in headers
        if root_valid and indexing_valid:
            return
        if attempt == 9:
            raise RuntimeError("Runtime routing or test indexing protection failed")
        time.sleep(0.25 * (attempt + 1))


def deploy(environment, sha, bundle):
    if environment not in TARGETS or not re.fullmatch(r"[a-f0-9]{40}", sha):
        raise ValueError("Invalid deployment target or revision")
    domain, root_name, config_name = TARGETS[environment]
    if not (CERTIFICATES / domain / "fullchain.pem").is_file():
        raise ValueError(f"Provision a valid certificate for {domain} before deployment")
    root, config = Path(root_name), Path(config_name).resolve()
    original_config = config.read_text() if config.exists() else None
    if original_config and set(re.findall(r"server_name\s+([^;]+);", original_config)) - {domain, f"{domain} www.{domain}"}:
        raise ValueError("Refusing to replace a configuration shared with another site")
    env_file = prepare_environment(environment)
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S%f")
    release = RELEASES / environment / f"{sha[:12]}-{stamp}"
    client = release / "client"
    extract_client(bundle / "client.tar.gz", client)
    if (root / "_astro").is_dir():
        for old in (root / "_astro").rglob('*'):
            destination = client / '_astro' / old.relative_to(root / '_astro')
            if old.is_file() and not destination.exists():
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(old, destination)
    run("docker", "load", "--input", str(bundle / "image.tar.gz"))
    image = f"laguntza-web:{sha}"
    name = f"laguntza-{environment}-{stamp}"
    state_file = STATE / f"{environment}.json"
    previous = json.loads(state_file.read_text()) if state_file.exists() else {}
    if original_config:
        atomic_write(release / 'nginx.previous.conf', original_config)
    atomic_write(release / 'previous.json', json.dumps(previous) + '\n', 0o600)
    old_root = None
    switched = False
    try:
        legal_env = ['--env-file', str(ENVIRONMENTS / 'legal.env')] if (ENVIRONMENTS / 'legal.env').is_file() else []
        run("docker", "run", "-d", "--name", name, "--restart", "unless-stopped", "--memory", "192m", "--memory-swap", "256m", "--cpus", "0.5", "--pids-limit", "100", "--read-only", "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--log-opt", "max-size=5m", "--log-opt", "max-file=2", "--env-file", str(env_file), *legal_env, "-e", "NODE_OPTIONS=--max-old-space-size=96", "-p", "127.0.0.1::4321", '--user', '1000:1000', '--entrypoint', '/usr/local/bin/node', image, './dist/server/entry.mjs')
        inspected = json.loads(run("docker", "inspect", name))[0]
        port = int(inspected["NetworkSettings"]["Ports"]["4321/tcp"][0]["HostPort"])
        wait_for_runtime(port, environment)
        if root.is_symlink():
            old_root = root.resolve()
        elif root.exists():
            old_root = release.parent / f"legacy-{stamp}"
            root.rename(old_root)
        temporary_link = root.with_name(f".{root.name}-{stamp}")
        temporary_link.symlink_to(client)
        temporary_link.replace(root)
        switched = True
        mail_state = STATE / 'mail.json'
        mail_port = json.loads(mail_state.read_text())['port'] if mail_state.exists() else 3000
        atomic_write(config, render_nginx(environment, root, port, content_security_policy(client), mail_port))
        run("nginx", "-t")
        run("systemctl", "reload", "nginx")
        verify_site(domain, environment)
        atomic_write(state_file, json.dumps({"sha": sha, "container": name, "image": image, "client": str(client), "port": port}, indent=2) + "\n", 0o600)
    except Exception:
        if switched:
            root.unlink()
        if old_root and not root.exists():
            root.symlink_to(old_root)
        if original_config is not None:
            atomic_write(config, original_config)
        else:
            config.unlink(missing_ok=True)
        run("nginx", "-t")
        run("systemctl", "reload", "nginx")
        subprocess.run(["docker", "rm", "-f", name], capture_output=True)
        print("Previous release restored")
        raise
    if previous.get("container"):
        subprocess.run(["docker", "stop", "--timeout", "20", previous["container"]], capture_output=True)
        subprocess.run(["docker", "rm", previous["container"]], capture_output=True)
    print(f"Deployed {sha} to {environment}; Node bound to loopback:{port}; memory limit 192 MiB")


def deploy_mail(sha, bundle):
    if not re.fullmatch(r'[a-f0-9]{40}', sha):
        raise ValueError('Invalid mail revision')
    test = json.loads((STATE / 'test.json').read_text())
    config = Path(TARGETS['test'][2]).resolve()
    original = config.read_text()
    env_file = prepare_environment('mail')
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d%H%M%S%f')
    release = RELEASES / 'mail' / f'{sha[:12]}-{stamp}'
    atomic_write(release / 'nginx.previous.conf', original)
    previous_file = STATE / 'mail.json'
    previous = json.loads(previous_file.read_text()) if previous_file.exists() else {}
    atomic_write(release / 'previous.json', json.dumps(previous) + '\n', 0o600)
    run('docker', 'load', '--input', str(bundle / 'image.tar.gz'))
    name = f'laguntza-mail-{stamp}'
    image = f'laguntza-web:{sha}'
    try:
        run('docker', 'run', '-d', '--name', name, '--restart', 'unless-stopped', '--memory', '192m', '--memory-swap', '256m', '--cpus', '0.5', '--pids-limit', '100', '--read-only', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--log-opt', 'max-size=5m', '--log-opt', 'max-file=2', '--env-file', str(env_file), '-e', 'NODE_OPTIONS=--max-old-space-size=96', '-p', '127.0.0.1::4321', '--user', '1000:1000', '--entrypoint', '/usr/local/bin/node', image, './dist/server/entry.mjs')
        inspected = json.loads(run('docker', 'inspect', name))[0]
        port = int(inspected['NetworkSettings']['Ports']['4321/tcp'][0]['HostPort'])
        wait_for_runtime(port, 'mail')
        health = json.loads(run('curl', '-fsS', f'http://127.0.0.1:{port}/health/'))
        if not (health.get('emailEnabled') is True and health.get('legacyContactEnabled') is True):
            raise ValueError('Incorrect compatibility mail flags')
        atomic_write(config, render_nginx('test', TARGETS['test'][1], test['port'], content_security_policy(Path(test['client'])), port))
        run('nginx', '-t')
        run('systemctl', 'reload', 'nginx')
        domain = TARGETS['test'][0]
        for attempt in range(15):
            status = run('curl', '-sS', '-o', '/dev/null', '-w', '%{http_code}', '--resolve', f'{domain}:443:127.0.0.1', '-H', 'Origin: https://laguntzafisioterapia.com', '-H', 'Content-Type: application/json', '--data', '{}', f'https://{domain}/api/contact-form')
            if status == '400':
                break
            if attempt == 14:
                raise ValueError('Compatibility endpoint validation failed')
            time.sleep(0.25)
        # No valid production form is submitted; these checks never send email.
        headers = run('curl', '-sS', '-D', '-', '-o', '/dev/null', '-X', 'OPTIONS', '--resolve', f'{domain}:443:127.0.0.1', '-H', 'Origin: https://laguntzafisioterapia.com', '-H', 'Access-Control-Request-Method: POST', '-H', 'Access-Control-Request-Headers: content-type', f'https://{domain}/api/contact-form').lower()
        if '204' not in headers or 'access-control-allow-origin: https://laguntzafisioterapia.com' not in headers:
            raise ValueError('Compatibility CORS failed')
        verify_site(domain, 'test')
        atomic_write(previous_file, json.dumps({'sha': sha, 'container': name, 'image': image, 'port': port}, indent=2) + '\n', 0o600)
    except Exception:
        atomic_write(config, original)
        run('nginx', '-t')
        run('systemctl', 'reload', 'nginx')
        subprocess.run(['docker', 'rm', '-f', name], capture_output=True)
        raise
    if previous.get('container'):
        subprocess.run(['docker', 'stop', '--timeout', '20', previous['container']], capture_output=True)
        subprocess.run(['docker', 'rm', previous['container']], capture_output=True)
    # Keep the old service available for rollback but remove its public listener.
    subprocess.run(['docker', 'update', '--restart=no', 'email-sender-api'], capture_output=True)
    subprocess.run(['docker', 'stop', '--timeout', '20', 'email-sender-api'], capture_output=True)
    print(f'Compatibility mail runtime deployed at loopback:{port}; legacy container stopped')


if __name__ == "__main__":
    if sys.argv[1] == 'mail':
        deploy_mail(sys.argv[2], Path(sys.argv[3]).resolve())
    else:
        deploy(sys.argv[1], sys.argv[2], Path(sys.argv[3]).resolve())
