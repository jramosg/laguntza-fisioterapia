import importlib.util
import tempfile
import unittest
from types import SimpleNamespace
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location(
    "routing", Path(__file__).parents[1] / "scripts/repair_test_routing.py"
)
routing = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(routing)


def configuration(root=routing.ROOT):
    return """server {
    listen 443 ssl;
    server_name test.laguntzafisioterapia.com;
    root ROOT;
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
    }
    location / {
        try_files $uri $uri/ /index.html;
    }
}
server {
    listen 80;
    server_name test.laguntzafisioterapia.com;
    return 301 https://$host$request_uri;
}
server {
    server_name another.example;
    root /var/www/another;
    location / { try_files $uri /index.html; }
}
""".replace("ROOT", root)


class RoutingTests(unittest.TestCase):
    def test_repairs_only_static_test_routes(self):
        original = configuration()
        result = routing.repair_config(original)
        self.assertIn("try_files $uri $uri/ =404;", result)
        self.assertIn("error_page 404 /404.html;", result)
        self.assertIn("location = /404.html {\n        internal;", result)
        self.assertIn("proxy_pass http://127.0.0.1:3000;", result)
        self.assertEqual(original[original.index("server {\n    listen 80"):],
                         result[result.index("server {\n    listen 80"):])

    def test_is_idempotent(self):
        result = routing.repair_config(configuration())
        self.assertEqual(result, routing.repair_config(result))

    def test_ignores_braces_inside_quotes_and_comments(self):
        source = configuration().replace("    location /api/ {", "    # }\n    add_header Example '{';\n    location /api/ {")
        self.assertIn("try_files $uri $uri/ =404;", routing.repair_config(source))

    def test_refuses_unexpected_fallback(self):
        with self.assertRaisesRegex(ValueError, "fallback"):
            routing.repair_config(configuration().replace("$uri/ /index.html", "$uri/ /router"))

    def test_refuses_shared_host_or_wrong_root(self):
        with self.assertRaisesRegex(ValueError, "shared"):
            routing.repair_config(configuration().replace(
                "server_name test.laguntzafisioterapia.com;",
                "server_name test.laguntzafisioterapia.com other.example;"))
        with self.assertRaisesRegex(ValueError, "exactly one"):
            routing.repair_config(configuration("/another/root"))

    def test_refuses_ambiguous_virtual_hosts(self):
        with self.assertRaisesRegex(ValueError, "exactly one"):
            routing.repair_config(configuration() + configuration())

    def test_waits_for_reloaded_workers_before_judging_the_404_response(self):
        old_worker = True

        def response(*args):
            nonlocal old_worker
            if args[-1].endswith(("/es/", "/eu/")):
                return SimpleNamespace(stdout="Laguntza\n200")
            if old_worker:
                old_worker = False
                return SimpleNamespace(stdout="Old fallback\n200")
            return SimpleNamespace(stdout="missing-page\n404")

        with (patch.object(routing, "command", side_effect=response) as commands,
              patch.object(routing.time, "sleep") as sleep):
            routing.verify_site()
            self.assertEqual(commands.call_count, 6)
            sleep.assert_called_once()

    def test_rolls_back_primary_and_disabled_backup_if_verification_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory).resolve()
            root = base / "site"
            root.mkdir()
            (root / "404.html").write_text("missing-page")
            primary = base / "laguntza-fisioterapia"
            duplicate = base / "laguntza-fisioterapia-backup-old"
            original = configuration(str(root))
            # The historical duplicate contains only this test virtual host.
            old = original[:original.index("server {\n    server_name another")]
            primary.write_text(original)
            duplicate.write_text(old)
            with (patch.object(routing, "PRIMARY", primary),
                  patch.object(routing, "ROOT", str(root)),
                  patch.object(routing, "BACKUPS", base / "rollback"),
                  patch.object(routing, "command") as commands,
                  patch.object(routing, "verify_site", side_effect=RuntimeError("Check failed"))):
                with self.assertRaisesRegex(RuntimeError, "Check failed"):
                    routing.apply_repair({primary: original, duplicate: old})
                self.assertEqual(primary.read_text(), original)
                self.assertEqual(duplicate.read_text(), old)
                self.assertEqual(commands.call_count, 4)


if __name__ == "__main__":
    unittest.main()
