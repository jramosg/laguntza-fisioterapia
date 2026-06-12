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
PORT=4000
JDBC_URL=jdbc:postgresql://localhost:5432/laguntza_booking?user=booking_app&password=booking_app
PUBLIC_SITE_URL=https://laguntzafisioterapia.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
BOOKING_ADMIN_EMAIL=info@laguntzafisioterapia.com
BOOKING_ADMIN_PASSWORD_HASH=...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
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
```
