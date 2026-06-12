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
- Availability is explicit per date/time window, not a repeating assumption.
- Admin can create manual phone/WhatsApp bookings without payment.
- Online slots are held while Stripe Checkout is pending.
- Confirmed, manual, and pending-payment bookings block overlapping slots.

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
- `POST /api/bookings/:id/cancel`
- `POST /api/stripe/webhook`

Admin:

- `POST /api/admin/login`
- `GET /api/admin/bookings?from=...&to=...`
- `POST /api/admin/bookings/manual`
- `POST /api/admin/availability-windows`
- `POST /api/admin/time-blocks`
- `POST /api/admin/bookings/:id/cancel`

## Development

```bash
clojure -M:dev -m laguntza.booking.core
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
