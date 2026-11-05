#!/usr/bin/python3 -I
"""Root-owned publication gate. Never execute code supplied in the release."""
import fcntl
import importlib.util
import json
import os
import re
import shutil
import sys
import tarfile
import tempfile
from pathlib import Path, PurePosixPath

ROLES = {'laguntza-test-deploy': {'test'}, 'laguntza-production-deploy': {'production', 'mail'}}
MAX_UPLOAD = 512 * 1024 * 1024
MAX_IMAGE = 1024 * 1024 * 1024
SERVER_MODULE = Path('/usr/local/lib/laguntza/release.py')
WORK = Path('/var/lib/laguntza/incoming')


def authorize(user, environment, sha):
    if environment not in ROLES.get(user, set()) or not re.fullmatch(r'[a-f0-9]{40}', sha):
        raise ValueError('Publication target is not authorized')


def extract_bundle(archive, destination):
    expected = {'client.tar.gz', 'image.tar.gz'}
    seen = set()
    with tarfile.open(archive, 'r:gz') as bundle:
        for member in bundle:
            path = PurePosixPath(member.name)
            if member.isdir() and member.name in ('.', './'):
                continue
            name = str(path)
            if not member.isfile() or name not in expected or name in seen or member.size > MAX_UPLOAD:
                raise ValueError('Invalid publication archive')
            seen.add(name)
            with bundle.extractfile(member) as source, (destination / name).open('xb') as target:
                shutil.copyfileobj(source, target)
    if seen != expected:
        raise ValueError('Incomplete publication archive')


def validate_image(archive, sha):
    total = 0
    manifest = None
    with tarfile.open(archive, 'r:gz') as image:
        for member in image:
            path = PurePosixPath(member.name)
            total += member.size
            if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()) or total > MAX_IMAGE:
                raise ValueError('Invalid or oversized image archive')
            if str(path) == 'manifest.json':
                if member.size > 65536:
                    raise ValueError('Invalid image manifest')
                manifest = json.load(image.extractfile(member))
    if not isinstance(manifest, list) or len(manifest) != 1 or manifest[0].get('RepoTags') != [f'laguntza-web:{sha}']:
        raise ValueError('Image must contain only the requested Laguntza tag')
    config_name = manifest[0].get('Config')
    if config_name:
        with tarfile.open(archive, 'r:gz') as image:
            member = image.getmember(config_name)
            if member.size > 1024 * 1024:
                raise ValueError('Invalid image configuration')
            config = json.load(image.extractfile(member))
            if config.get('config', {}).get('Volumes'):
                raise ValueError('Runtime image must not declare volumes')


def main():
    if os.geteuid() != 0 or len(sys.argv) != 3:
        raise ValueError('Use the authorized publication command')
    environment, sha = sys.argv[1:]
    authorize(os.environ.get('SUDO_USER', ''), environment, sha)
    WORK.mkdir(parents=True, mode=0o700, exist_ok=True)
    with (WORK.parent / 'publish.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        if shutil.disk_usage(WORK).free < 5 * 1024 * 1024 * 1024:
            raise ValueError('Insufficient free space for a safe release')
        with tempfile.TemporaryDirectory(prefix='release-', dir=WORK) as directory:
            directory = Path(directory)
            archive = directory / 'incoming.tar.gz'
            total = 0
            with archive.open('xb') as output:
                while chunk := sys.stdin.buffer.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_UPLOAD:
                        raise ValueError('Publication upload exceeds limit')
                    output.write(chunk)
            extract_bundle(archive, directory)
            validate_image(directory / 'image.tar.gz', sha)
            spec = importlib.util.spec_from_file_location('trusted_release', SERVER_MODULE)
            release = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(release)
            if environment == 'mail':
                release.deploy_mail(sha, directory)
            else:
                release.deploy(environment, sha, directory)


if __name__ == '__main__':
    main()
