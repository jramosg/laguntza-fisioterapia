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
    def test_virtual_host_guard_ignores_server_name_variables_and_still_detects_other_sites(self):
        config = 'limit_conn_zone $server_name zone=laguntza_mail_connections:1m;\nserver { server_name test.laguntzafisioterapia.com; }'
        self.assertEqual(deployment.configured_server_names(config), {'test.laguntzafisioterapia.com'})
        self.assertEqual(deployment.configured_server_names(config + '\nserver { server_name other.example; }'), {'test.laguntzafisioterapia.com', 'other.example'})
    def test_production_requires_explicit_configuration_without_reading_legacy_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            settings = Path(directory) / 'production.env'
            with patch.object(deployment, 'ENVIRONMENTS', Path(directory)), patch.object(deployment, 'run') as command:
                with self.assertRaisesRegex(ValueError, 'Configure'):
                    deployment.prepare_environment('production')
                self.assertFalse(settings.exists())
                settings.write_text('EMAIL_ENABLED=true\nRESEND_API_KEY=mock-key\nFROM_EMAIL=clinic@example.com\nCOMPANY_EMAIL=office@example.com\n')
                self.assertEqual(deployment.prepare_environment('production'), settings)
                command.assert_not_called()

    def test_test_configuration_cannot_enable_delivery_and_enabled_delivery_requires_settings(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(deployment, 'ENVIRONMENTS', Path(directory)):
                settings = deployment.prepare_environment('test')
                self.assertEqual(settings.read_text(), 'EMAIL_ENABLED=false\n')
                self.assertEqual(settings.stat().st_mode & 0o777, 0o600)
                settings.write_text('EMAIL_ENABLED=true\n')
                with self.assertRaisesRegex(ValueError, 'Test must'):
                    deployment.prepare_environment('test')
                (Path(directory) / 'production.env').write_text('EMAIL_ENABLED=true\n')
                with self.assertRaisesRegex(ValueError, 'explicit sender'):
                    deployment.prepare_environment('production')

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
        self.assertIn('location ^~ /api/ { return 404; }', config)
        self.assertNotIn('/api/contact-form', config)
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
            with (patch.object(deployment, 'TARGETS', {'test': ('test.laguntzafisioterapia.com', str(root), str(config))}),
                  patch.object(deployment, 'CERTIFICATES', base / 'certificates'),
                  patch.object(deployment, 'STATE', state),
                  patch.object(deployment, 'RELEASES', base / 'releases'),
                  patch.object(deployment, 'prepare_environment', return_value=base / 'test.env'),
                  patch.object(deployment, 'run', return_value='') as run,
                  patch.object(deployment, 'wait_for_runtime'),
                  patch.object(deployment, 'verify_site', side_effect=RuntimeError('failed check')),
                  patch.object(deployment.subprocess, 'run') as cleanup):
                with self.assertRaisesRegex(RuntimeError, 'failed check'):
                    deployment.deploy('test', 'a' * 40, bundle)
                self.assertEqual(config.read_text(), original)
                self.assertEqual((root / 'old.html').read_text(), 'old')
                self.assertEqual(json.loads((state / 'test.json').read_text())['container'], 'old-runtime')
                self.assertNotIn('old-runtime', str(cleanup.call_args_list))
                docker_run = next(call.args for call in run.call_args_list if call.args[:2] == ('docker', 'run'))
                self.assertIn('127.0.0.1:4410:4321', docker_run)

    def test_runtime_alternates_between_fixed_ports(self):
        self.assertEqual(deployment.runtime_port('test', {}), 4410)
        self.assertEqual(deployment.runtime_port('test', {'port': 32776}), 4410)
        self.assertEqual(deployment.runtime_port('test', {'port': 4410}), 4411)
        self.assertEqual(deployment.runtime_port('test', {'port': 4411}), 4410)
        self.assertEqual(deployment.runtime_port('production', {'port': 4420}), 4421)

    def test_verification_waits_for_the_new_https_virtual_host_after_reload(self):
        failure = deployment.subprocess.CalledProcessError(60, ('curl',))
        replies = [failure, 'Laguntza\n200', 'Laguntza\n200',
                   'missing-page\n404', 'Location: /eu/\nCache-Control: private, no-store\n']
        with patch.object(deployment, 'run', side_effect=replies) as command, patch.object(deployment.time, 'sleep') as sleep:
            deployment.verify_site('laguntzafisioterapia.com', 'production')
        self.assertEqual(command.call_count, 5)
        sleep.assert_called_once_with(0.25)
        for call in command.call_args_list:
            self.assertNotIn('-k', call.args)
            self.assertNotIn('--insecure', call.args)

    def test_verification_rejects_a_persistently_invalid_certificate(self):
        failure = deployment.subprocess.CalledProcessError(60, ('curl',))
        with patch.object(deployment, 'run', side_effect=failure) as command, patch.object(deployment.time, 'sleep'):
            with self.assertRaises(deployment.subprocess.CalledProcessError):
                deployment.verify_site('laguntzafisioterapia.com', 'production')
        self.assertEqual(command.call_count, 10)

    def test_verification_rejects_a_persistently_incorrect_page(self):
        with patch.object(deployment, 'run', return_value='wrong site\n200') as command, patch.object(deployment.time, 'sleep'):
            with self.assertRaisesRegex(RuntimeError, 'Release check failed'):
                deployment.verify_site('laguntzafisioterapia.com', 'production')
        self.assertEqual(command.call_count, 10)
