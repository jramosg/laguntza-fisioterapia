import importlib.util
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('gate', Path(__file__).parents[1] / 'deploy/publish.py')
gate = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(gate)


def archive(path, files):
    with tarfile.open(path, 'w:gz') as bundle:
        for name, content in files.items():
            info = tarfile.TarInfo(name); info.size = len(content)
            bundle.addfile(info, io.BytesIO(content))


class PublicationGateTests(unittest.TestCase):
    def test_test_identity_cannot_publish_mail_or_production_or_inject_revision(self):
        gate.authorize('laguntza-test-deploy', 'test', 'a' * 40)
        for user, environment, sha in [('laguntza-test-deploy', 'production', 'a' * 40), ('laguntza-test-deploy', 'mail', 'a' * 40), ('root', 'test', 'a' * 40), ('laguntza-test-deploy', 'test', 'a' * 40 + ';id')]:
            with self.assertRaises(ValueError): gate.authorize(user, environment, sha)

    def test_bundle_rejects_uploaded_python_code_and_traversal(self):
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            for name in ['release.py', '../image.tar.gz', '/etc/laguntza/test.env']:
                source = directory / 'bundle.tar.gz'
                archive(source, {name: b'not allowed'})
                with self.assertRaises(ValueError): gate.extract_bundle(source, directory)

    def test_image_cannot_replace_another_project_tag(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'image.tar.gz'
            archive(source, {'manifest.json': json.dumps([{'RepoTags': ['other-project:latest']}]).encode()})
            with self.assertRaises(ValueError): gate.validate_image(source, 'a' * 40)
            archive(source, {'manifest.json': json.dumps([{'RepoTags': ['laguntza-web:' + 'a' * 40]}]).encode()})
            gate.validate_image(source, 'a' * 40)

    def test_image_cannot_request_anonymous_volumes(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'image.tar.gz'
            manifest = [{'RepoTags': ['laguntza-web:' + 'a' * 40], 'Config': 'config.json'}]
            archive(source, {'manifest.json': json.dumps(manifest).encode(), 'config.json': json.dumps({'config': {'Volumes': {'/data': {}}}}).encode()})
            with self.assertRaises(ValueError): gate.validate_image(source, 'a' * 40)
