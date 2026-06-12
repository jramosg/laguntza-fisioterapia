# Laguntza Booking API

Clojure backend for online and manual appointment booking.

## Architecture

- Astro renders the public website and booking UI.
- This API owns scheduling, payments, admin auth, notifications, audit logs,
  and all writes.
- PostgreSQL stores the source of truth.
- Stripe Checkout collects online payments before confirmation.
- Manual admin bookings are confirmed without pre-payment.
- Telegram can notify the physiotherapist immediately. Email confirms the
  appointment and terms to the patient.
- Admin sessions are signed server-side tokens. Passwords use PBKDF2 hashes.
- Stripe webhooks are verified before a booking is confirmed as paid.
- API errors are JSON. Security headers are applied at the API boundary.

## Hosting Recommendation

Start with PostgreSQL on the same VPS as the API, private to the machine or
Docker network. Add:

- daily encrypted backups copied off the VPS
- a monthly restore test
- a separate DB user for the app
- no public PostgreSQL port
- migrations run before deployment

Move to managed PostgreSQL later when uptime requirements justify it.

## Rules

- Services: 30 minute session and 60 minute session.
- Cancellation and reschedule window: 24 hours before start time.
- Availability comes from two sources: a weekly recurring schedule
  (`recurring_windows`, e.g. every Monday 09:00–14:00, clinic timezone)
  plus explicit one-off date windows. Time blocks subtract from both,
  so holidays are a block, not a schedule edit.
- Admin can create manual phone/WhatsApp bookings without payment.
- Online slots are held for 35 minutes while Stripe Checkout is pending
  (the Stripe session itself expires after ~30), then released.
- Confirmed, manual, and pending-payment bookings block overlapping slots,
  enforced both in the API and by a PostgreSQL exclusion constraint.
- Checkout only accepts a `starts_at` that is currently an open slot.
- Patient cancellation requires the booking id plus the `public_token`
  from the confirmation email (`Referencia`).
- Admin login is throttled per email and per IP (5 failures / 15 min).

## Environment

```bash
APP_ENV=production
PORT=4000
JDBC_URL=jdbc:postgresql://localhost:5432/laguntza_booking?user=booking_app&password=booking_app
PUBLIC_SITE_URL=https://laguntzafisioterapia.com
BOOKING_API_URL=https://booking.laguntzafisioterapia.com
BOOKING_SESSION_SECRET=generate-a-long-random-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BOOKING_ADMIN_EMAIL=info@laguntzafisioterapia.com
BOOKING_ADMIN_PASSWORD_HASH=...
BOOKING_STAFF_NAME=Laguntza Fisioterapia
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=info@laguntzafisioterapia.com
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Generate an admin password hash from a trusted shell:

```bash
clojure -M -e "(require '[laguntza.booking.security :as s]) (println (s/password-hash \"replace-me\"))"
```

## API Contract

Public:

- `GET /api/health`
- `GET /api/services`
- `GET /api/availability?service_id=session_60&date=2026-06-15`
- `POST /api/bookings/checkout`
- `POST /api/bookings/:id/cancel` with body `{"token": "<public_token>"}`
- `POST /api/stripe/webhook`

Admin:

- `POST /api/admin/login`
- `GET /api/admin/bookings?from=...&to=...`
- `POST /api/admin/bookings/manual`
- `POST /api/admin/availability-windows`
- `GET|POST /api/admin/recurring-windows`
  (`{"weekday": 1, "start_time": "09:00", "end_time": "14:00"}`,
  weekday 1 = Monday .. 7 = Sunday)
- `POST /api/admin/recurring-windows/:id/deactivate`
- `POST /api/admin/time-blocks`
- `POST /api/admin/bookings/:id/cancel`

## Development

```bash
# Start the API (loads .env automatically)
clojure -M:dev -m laguntza.booking.core

# Seed dev admin — email from BOOKING_ADMIN_EMAIL, password: admin123
clojure -M:dev -m laguntza.booking.seed

clojure -M:test
clj-kondo --lint src test
```

Without `JDBC_URL`, `/api/health` still boots for smoke tests and reports
`"database": false`. Booking, admin, and availability endpoints require
PostgreSQL.

## Docker

For a single VPS, copy `booking-api/.env` from the environment template and run:

```bash
docker compose up -d --build
```

The compose file binds the API to `127.0.0.1:4000` so a reverse proxy can
terminate TLS. PostgreSQL is private to Docker and persists in the
`postgres-data` volume.

## Enterprise Readiness Roadmap

Honest gap analysis from the perspective of a large multi-clinic buyer.
The current system is production-ready for a single clinic with one
therapist and one admin. To sell it as a product, close these in order.

Deal-breakers (a technical reviewer finds these in the first hour):

- Multi-staff / multi-location: every endpoint resolves `default-staff`
  (the first active row). The schema already carries `staff_id`
  everywhere; the API never lets the caller choose a therapist or
  clinic.
- Admin UI: see `/admin` for the current panel; it covers one
  receptionist at one clinic and needs roles before a chain can use it.
- `audit_log` is never written. Admin actions must insert audit rows
  (actor, action, booking, ip) or remove the table.
- One admin role, no SSO (SAML/OIDC), no 2FA.
- CI only checks Prettier formatting; the Clojure test suite does not
  run on push.
- Single-instance assumptions: login throttling and app state are in
  process memory, so they break behind a load balancer. No HA story.

Product features clinics run on:

- Reminder notifications (T-24h) — the main no-show reduction lever —
  plus an internal scheduler instead of an external cron hitting
  `/api/admin/notifications/process`.
- Reschedule flow and Stripe refunds (`payment_status = 'refunded'`
  exists in the schema; no code path calls the refund API).
- Spanish physio specifics: bonos (multi-session packs),
  mutuas/insurance billing, invoicing (VeriFactu).
- `checkout.session.expired` webhook to release held slots early.
- Patient accounts and history, intake/consent forms, waitlists,
  Google Calendar sync (`google_calendar_id` exists, unused).

Compliance and operations:

- GDPR Article 9: booking notes are health data. Needs a retention and
  erasure policy with a data-deletion path (none exists), a privacy
  policy page the terms checkbox links to, a DPA template, and an
  encryption-at-rest statement. Buyers will ask for a pen-test report
  and ISO 27001 / SOC 2.
- Observability: structured logs exist, but no metrics, error tracker,
  or alerting on webhook/notification failures.
- OpenAPI spec (reitit can generate Swagger), integration tests against
  real PostgreSQL, load tests, a staging environment.

## Deployment Checklist

- Run behind TLS only.
- Keep PostgreSQL private to the VPS or private network.
- Do not expose PostgreSQL to the public internet.
- Run migrations at API startup or as a deployment step.
- Set `APP_ENV=production`; missing critical secrets will fail fast.
- Configure Stripe webhook delivery to `/api/stripe/webhook`.
- Run a cron or systemd timer against `/api/admin/notifications/process`.
- Back up PostgreSQL daily to encrypted off-server storage.
- Test restore monthly against a separate database.
- Monitor API health, 5xx rate, Stripe webhook failures, and notification
  failures.
