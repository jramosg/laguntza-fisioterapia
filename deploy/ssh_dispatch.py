#!/usr/bin/python3 -I
"""Forced SSH command; disallow shells, SCP, forwarding and other commands."""
import os
import pwd
import re
import shlex
import sys

roles = {'laguntza-test-deploy': {'test'}, 'laguntza-production-deploy': {'production', 'mail'}}
user = pwd.getpwuid(os.getuid()).pw_name
try:
    arguments = shlex.split(os.environ.get('SSH_ORIGINAL_COMMAND', ''))
    if len(arguments) != 3 or arguments[0] != 'publish' or arguments[1] not in roles.get(user, set()) or not re.fullmatch(r'[a-f0-9]{40}', arguments[2]):
        raise ValueError()
except ValueError:
    sys.exit('Only the authorized Laguntza publication command is allowed')
os.execv('/usr/bin/sudo', ['sudo', '-n', '/usr/local/sbin/laguntza-publish', *arguments[1:]])
