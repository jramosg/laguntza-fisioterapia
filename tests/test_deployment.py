import importlib.util
import io
import base64
import hashlib
import json
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('deployment', Path(__file__).parents[1] / 'deploy/release.py')
deployment = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deployment)


class DeploymentTests(unittest.TestCase):
    def test_mail_configuration_preserves_the_old_clinic_bcc_destination(self):
        with tempfile.TemporaryDirectory() as directory:
            response = json.dumps([{'Config': {'Env': ['RESEND_API_KEY=mock-key', 'FROM_EMAIL=clinic@example.com', 'BCC_EMAIL=office@example.com']}}])
            with patch.object(deployment, 'ENVIRONMENTS', Path(directory)), patch.object(deployment, 'run', return_value=response):
                settings = deployment.prepare_environment('mail')
                values = dict(line.split('=', 1) for line in settings.read_text().splitlines())
                self.assertEqual(values['COMPANY_EMAIL'], 'office@example.com')
                self.assertNotIn('BCC_EMAIL', values)
                self.assertEqual(values['EMAIL_ENABLED'], 'true')
                self.assertEqual(values['LEGACY_CONTACT_ENABLED'], 'true')
                self.assertEqual(settings.stat().st_mode & 0o777, 0o600)

    def test_failed_mail_deployment_restores_proxy_and_keeps_original_sender(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            state = base / 'state'; state.mkdir()
            client = base / 'client'; client.mkdir()
            (client / 'index.html').write_text('<html></html>')
            (state / 'test.json').write_text(json.dumps({'port': 32100, 'client': str(client)}))
            config = base / 'nginx.conf'; config.write_text('old proxy configuration')
            def command(*args):
                if args[:2] == ('docker', 'inspect'):
                    return json.dumps([{'NetworkSettings': {'Ports': {'4321/tcp': [{'HostPort': '32101'}]}}}])
                if args[0] == 'curl':
                    return json.dumps({'emailEnabled': True, 'legacyContactEnabled': True}) if '/health/' in args[-1] else '400'
                return ''
            with (patch.object(deployment, 'STATE', state), patch.object(deployment, 'RELEASES', base / 'releases'),
                  patch.object(deployment, 'TARGETS', {'test': ('test.laguntzafisioterapia.com', str(client), str(config))}),
                  patch.object(deployment, 'prepare_environment', return_value=base / 'mail.env'), patch.object(deployment, 'run', side_effect=command),
                  patch.object(deployment, 'wait_for_runtime'), patch.object(deployment.subprocess, 'run') as cleanup):
                with self.assertRaisesRegex(ValueError, 'CORS'):
                    deployment.deploy_mail('b' * 40, base)
                self.assertEqual(config.read_text(), 'old proxy configuration')
                self.assertFalse((state / 'mail.json').exists())
                self.assertNotIn('email-sender-api', str(cleanup.call_args_list))
    def test_csp_hashes_executable_scripts_without_allowing_inline_execution(self):
        with tempfile.TemporaryDirectory() as directory:
            client = Path(directory)
            script = "document.documentElement.dataset.theme='dark';"
            (client / 'index.html').write_text(f'<script>{script}</script><script type="application/ld+json">{{}}</script>')
            policy = deployment.content_security_policy(client)
            digest = base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
            script_policy = next(part for part in policy.split('; ') if part.startswith('script-src '))
            self.assertIn("'sha256-" + digest + "'", script_policy)
            self.assertNotIn('unsafe-inline', script_policy)
            self.assertNotIn('unsafe-eval', policy)
            self.assertIn("frame-ancestors 'none'", policy)
            self.assertIn("form-action 'self'", policy)
            self.assertIn('https://tile.openstreetmap.org', policy)

    def test_test_host_keeps_static_pages_and_proxies_only_runtime_routes(self):
        config = deployment.render_nginx('test', '/var/www/laguntza-fisioterapia', 32100)
        self.assertIn('location = / {', config)
        self.assertIn('location ^~ /_actions/', config)
        self.assertIn('proxy_pass http://127.0.0.1:32100;', config)
        self.assertIn('try_files $uri $uri/ =404;', config)
        self.assertIn('X-Robots-Tag "noindex, nofollow" always', config)
        self.assertIn('proxy_set_header X-Forwarded-For $remote_addr;', config)
        self.assertIn('proxy_pass http://127.0.0.1:3000/api/contact-form/;', config)
        self.assertIn('limit_conn laguntza_mail_connections 1;', config)
        self.assertIn('limit_req zone=laguntza_test_actions burst=10 nodelay;', config)
        self.assertIn('limit_req_status 429;', config)
        self.assertIn('Content-Security-Policy', config)

    def test_production_is_indexable_and_canonicalizes_www(self):
        config = deployment.render_nginx('production', '/var/www/laguntza-fisioterapia-production', 32101)
        self.assertNotIn('noindex', config)
        self.assertNotIn('127.0.0.1:3000', config)
        self.assertIn('www.laguntzafisioterapia.com', config)
        self.assertIn('return 301 https://laguntzafisioterapia.com$request_uri;', config)

    def test_failed_verification_restores_config_static_root_and_old_container(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            root = base / 'site'
            root.mkdir()
            (root / 'old.html').write_text('old')
            config = base / 'nginx.conf'
            original = 'server { server_name test.laguntzafisioterapia.com; }'
            config.write_text(original)
            certificates = base / 'certificates/test.laguntzafisioterapia.com'
            certificates.mkdir(parents=True)
            (certificates / 'fullchain.pem').write_text('public certificate')
            bundle = base / 'bundle'
            bundle.mkdir()
            with tarfile.open(bundle / 'client.tar.gz', 'w:gz') as archive:
                for name in ('es/index.html', 'eu/index.html', '404.html'):
                    content = b'new static page'
                    item = tarfile.TarInfo(name)
                    item.size = len(content)
                    archive.addfile(item, io.BytesIO(content))
            state = base / 'state'
            state.mkdir()
            (state / 'test.json').write_text(json.dumps({'container': 'old-runtime'}))
            def command(*args):
                if args[:2] == ('docker', 'inspect'):
                    return json.dumps([{'NetworkSettings': {'Ports': {'4321/tcp': [{'HostPort': '32100'}]}}}])
                return ''
            with (patch.object(deployment, 'TARGETS', {'test': ('test.laguntzafisioterapia.com', str(root), str(config))}),
                  patch.object(deployment, 'CERTIFICATES', base / 'certificates'),
                  patch.object(deployment, 'STATE', state),
                  patch.object(deployment, 'RELEASES', base / 'releases'),
                  patch.object(deployment, 'prepare_environment', return_value=base / 'test.env'),
                  patch.object(deployment, 'run', side_effect=command),
                  patch.object(deployment, 'wait_for_runtime'),
                  patch.object(deployment, 'verify_site', side_effect=RuntimeError('failed check')),
                  patch.object(deployment.subprocess, 'run') as cleanup):
                with self.assertRaisesRegex(RuntimeError, 'failed check'):
                    deployment.deploy('test', 'a' * 40, bundle)
                self.assertEqual(config.read_text(), original)
                self.assertEqual((root / 'old.html').read_text(), 'old')
                self.assertEqual(json.loads((state / 'test.json').read_text())['container'], 'old-runtime')
                self.assertNotIn('old-runtime', str(cleanup.call_args_list))
