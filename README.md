# Laguntza Fisioterapia

Bilingual Basque/Spanish clinic website, built with Astro 7, TypeScript 7,
GSAP, Leaflet and Three.js. Local photographs are optimized during the build.

## Architecture

- Localized pages under `/es/` and `/eu/` are generated as static HTML.
- Nginx serves the pages and assets directly.
- A small Astro Node runtime handles `/` and `/_actions/`.
- The root selects the language using a valid manual-choice cookie, then
  `Accept-Language`, then Spanish. Explicit localized URLs always win.
- Manual language links remember the choice for one year. Root redirects
  preserve query parameters and send `Cache-Control: private, no-store`.
- Astro Actions validates the contact form and sends through Resend.
- Test and production use the same build with independent runtime settings.

## Development and checks

Use Node **26.13.0 LTS** (`.nvmrc`) and **pnpm 12.16.1** (`packageManager`).

```sh
nvm use
npm install --global pnpm@12.16.1
pnpm install --frozen-lockfile
pnpm dev
```

| Command | Purpose |
| --- | --- |
| `pnpm format:check` | Check formatting |
| `pnpm check` | Generate Astro types and check TypeScript modules |
| `pnpm test` | Unit tests for language, mail, theme, routing and rollback |
| `pnpm build` | Build static pages and Node server |
| `pnpm test:integration` | Test the compiled server with email disabled |
| `pnpm start` | Run the compiled server |
| `pnpm check-updates` | Compare dependencies with current stable versions |

The current `astro check` package does not support TypeScript 7. The project
uses Astro compilation and `tsc --noEmit`; the contact client is a separate
TypeScript module so its Actions calls are checked as well.

## Contact form

Set variables **at runtime**, never in `PUBLIC_*` variables or the Docker build:

```dotenv
EMAIL_ENABLED=false
RESEND_API_KEY=
FROM_EMAIL=
COMPANY_EMAIL=
BCC_EMAIL=
```

The default is no delivery. With `EMAIL_ENABLED=false`, the Action validates
input and attachments, returns `delivered: false`, and never instantiates or
calls Resend. The UI explicitly says that no email was sent. No Resend
credentials are needed in test.

With delivery enabled, the service uses separate branded ES/EU email layouts. The
sender, clinic recipients and BCC are configured on the server. The clinic
receives the message and attachments. The visitor receives a separate minimal
confirmation without clinical content, the visitor's phone number, BCC or attachments. A
failed confirmation does not discard a request already delivered to the clinic.
Both messages use independent idempotency keys. The shared email frame uses
inline styles and presentation tables, with mobile and dark-mode enhancements.
Visitor data is escaped and appears only in the clinic email. The confirmation
renderer accepts only the locale. These templates belong to the Astro backend;
updating them does not send emails.

Limits: three attachments, 10 MiB each and 15 MiB total, 16 MiB HTTP body,
two submissions per minute and five per hour per client IP for delivery.
The server checks filenames, declared MIME and binary signatures, assigns
the MIME itself, and rejects DOCX containers with a VBA project filename.
These checks are not antivirus scanning; a matching signature cannot prove
that an attachment is safe. Attachments are never stored or served by the site.
Nginx overwrites forwarding headers and Node is accessible only on loopback.
Nginx also rate limits Actions before the request reaches Node, including
requests with invalid input and requests in the email-disabled test environment.
A honeypot rejects automated submissions. A stable submission identifier is
used as a Resend idempotency key when retrying the same form.

The unit tests replace the email transport. Integration tests explicitly
start the runtime with delivery disabled. Neither test suite sends real mail.

## VPS deployment

The **Deploy to Server** workflow is manual. Choose `test` or `production`.
Production deployment requires the `master` branch; test can deploy the
current feature branch. Updating test does not update production or switch the
existing production mail backend.

Deployment secrets (with scoped keys in the `Test` and `Production` environments):

```text
SERVER_HOST
SERVER_USER
SERVER_SSH_KEY
SERVER_PORT
```

The SSH host key is pinned in `deploy/known_hosts`. CI validates format,
types, dependency advisories, unit tests and HTTP integration before building the runtime image.
GitHub Actions are pinned to commit hashes and Dependabot checks npm,
Actions and Docker updates weekly.
Deployment scans the runtime image with Trivy for secrets and high/critical
OS and library vulnerabilities with available fixes, and stops on findings.
The runtime stage applies Debian package fixes and removes npm/corepack;
package managers remain available only in the build stages.
The image and static files are uploaded over SSH; the VPS does not build
Node dependencies.

`deploy/release.py` starts the new container on a fixed loopback port,
alternating between two per environment (test 4410/4411, production
4420/4421) so the Nginx upstream survives reboots, and checks it before switching Nginx and the static-directory symlink. Previous
hashed assets remain available to open browser tabs. Failed checks restore
the old files, Nginx configuration and runtime. The previous container is
stopped only after the new release passes checks. A successful release then
removes older static releases and `laguntza-web` images, keeping the current
and previous ones of each environment and any image a container uses.

### Restricted publication identities

CI builds and scans before accessing deployment credentials. A separate job
downloads the immutable artifact and checks its checksum. `Test` uses a dedicated
SSH key that may publish only test. `Production` uses another key, may publish
only production, and requires the repository owner's review after the build.

Both SSH identities use a forced command with forwarding and shells disabled.
Their only sudo permission is the fixed, root-owned `laguntza-publish` program.
It validates the target, revision, archive members and image tag, and imports
the release code installed by the administrator on the server. It never runs
Python uploaded by the workflow. Updating the trusted server helper requires
an administrative installation, separate from a normal application deployment.

Server files: `/usr/local/sbin/laguntza-publish`,
`/usr/local/libexec/laguntza-ssh-dispatch`, and
`/usr/local/lib/laguntza/release.py`. The source counterparts are in `deploy/`.
The gate serializes publications, rejects other project image tags and uploaded
scripts, bounds upload/image size and refuses deployment with low disk space.
Containers explicitly use numeric UID/GID 1000 and the Node entrypoint.

Nginx sends a Content Security Policy with hashes of the built inline scripts,
without `unsafe-inline` or `unsafe-eval` for JavaScript. Dynamic inline styles
remain allowed for ClientRouter, GSAP and Leaflet. The policy restricts image
sources to the site and OpenStreetMap tiles, blocks framing and objects, and
restricts form submissions to the site.

Each runtime has a 192 MiB memory limit, 96 MiB V8 heap limit and 0.5 CPU
limit. The container runs as a non-root user, with a read-only filesystem,
a temporary directory and bounded logs. Limits are caps, not reservations.

| Environment | Host | Static root | Runtime settings |
| --- | --- | --- | --- |
| Test | `test.laguntzafisioterapia.com` | `/var/www/laguntza-fisioterapia` | `/etc/laguntza/test.env` |
| Production | `laguntzafisioterapia.com` | `/var/www/laguntza-fisioterapia-production` | `/etc/laguntza/production.env` |

Test is marked `noindex` and requires `EMAIL_ENABLED=false`. Production requires
an explicitly configured `/etc/laguntza/production.env` before deployment.
Set `EMAIL_ENABLED=true` and review `RESEND_API_KEY`, `FROM_EMAIL`, `COMPANY_EMAIL`
and optional `BCC_EMAIL`; the helper never infers recipients or copies old
credentials automatically. Keep the file root-owned with mode 0600.

The Astro runtime exposes the contact Action, not the old JSON email API.
The standalone `email-sender` service has been retired. Contact submissions and
email delivery use Astro Actions, with a 16 MiB limit in the Node adapter,
Actions and web proxy. The old `/api/contact-form` endpoint returns 404; no
deployment recreates its proxy or reads legacy mail settings. Its former
repository is deprecated, with deployments disabled and secrets removed.

Release metadata is in `/var/lib/laguntza/<environment>.json`; previous
Nginx configuration and static files are retained under
`/var/www/laguntza-releases/<environment>/`.

### Production cutover

Before the first production deployment, provision a certificate at
`/etc/letsencrypt/live/laguntzafisioterapia.com/` covering both the apex and
`www` names. The test certificate already exists. The deployment deliberately
refuses to replace a virtual host without its certificate or to overwrite a
configuration shared with unrelated domains.

Deploy and validate production before updating web DNS records. Preserve
mail records, Resend verification and Search Console verification. When changing
hosting providers, retain the previous published site while old DNS caches drain.
The deployment workflow never changes DNS or publishes to Netlify.

After merging to `master`, start production publication with:

```sh
gh workflow run deploy-server.yml --ref master -f environment=production
```

The production environment requires owner approval after CI and image scanning.
Keep the test host independent with email delivery disabled.

### Legal identity

The public professional tax identifier is configured only in
`/etc/laguntza/legal.env`, owned by root with mode 0600. The variable name is
`LEGAL_NIF`. Never copy its value into Git, GitHub secrets, CI logs, build
arguments or artifacts. Test and production Node containers read that private
file at startup.

The legal notice at `/es/legal/` and `/eu/legal/` renders on demand with
`Cache-Control: private, no-store`. It is not generated in the static build.
The remaining public pages, including privacy information, remain static.
If the runtime identifier is absent, the legal page returns 503 rather than
publishing an invented value. Legal texts must still be checked by the clinic
against its actual processing practices and administrative authorizations.

## Astro references

- [Astro 6 migration](https://docs.astro.build/en/guides/upgrade-to/v6/)
- [Astro 7 migration](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Actions and form validation](https://docs.astro.build/en/guides/actions/)
- [Selective server rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/)
- [Runtime secrets](https://docs.astro.build/en/guides/environment-variables/)

## License

MIT. See [LICENSE](LICENSE).
