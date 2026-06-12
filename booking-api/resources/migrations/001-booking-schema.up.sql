CREATE EXTENSION IF NOT EXISTS pgcrypto;
--;;
CREATE EXTENSION IF NOT EXISTS btree_gist;
--;;
CREATE TABLE booking_services (
  id text PRIMARY KEY,
  name_es text NOT NULL,
  name_eu text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (30, 60)),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'eur',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
--;;
CREATE TABLE booking_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  google_calendar_id text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
--;;
CREATE TABLE booking_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES booking_staff(id),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'owner',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
--;;
CREATE TABLE availability_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES booking_staff(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  note text,
  created_by uuid REFERENCES booking_admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
--;;
CREATE INDEX availability_windows_staff_time_idx
  ON availability_windows (staff_id, starts_at, ends_at);
--;;
CREATE TABLE time_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES booking_staff(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_by uuid REFERENCES booking_admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
--;;
CREATE INDEX time_blocks_staff_time_idx
  ON time_blocks (staff_id, starts_at, ends_at);
--;;
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  staff_id uuid NOT NULL REFERENCES booking_staff(id),
  service_id text NOT NULL REFERENCES booking_services(id),
  source text NOT NULL CHECK (source IN ('online', 'manual')),
  status text NOT NULL CHECK (
    status IN (
      'pending_payment',
      'confirmed',
      'cancelled',
      'completed',
      'no_show'
    )
  ),
  payment_status text NOT NULL CHECK (
    payment_status IN ('not_required', 'pending', 'paid', 'refunded', 'failed')
  ),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  patient_name text NOT NULL,
  patient_email text NOT NULL,
  patient_phone text,
  patient_locale text NOT NULL DEFAULT 'es' CHECK (patient_locale IN ('es', 'eu')),
  terms_accepted_at timestamptz,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  notes text,
  cancel_reason text,
  cancelled_at timestamptz,
  created_by uuid REFERENCES booking_admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
--;;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_overlap
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  )
  WHERE (status IN ('pending_payment', 'confirmed'));
--;;
CREATE INDEX bookings_staff_time_idx ON bookings (staff_id, starts_at, ends_at);
--;;
CREATE INDEX bookings_status_idx ON bookings (status);
--;;
CREATE INDEX bookings_patient_email_idx ON bookings (patient_email);
--;;
CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  channel text NOT NULL CHECK (channel IN ('email', 'telegram')),
  event text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  run_after timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
--;;
CREATE INDEX notification_outbox_pending_idx
  ON notification_outbox (run_after, created_at)
  WHERE status = 'pending';
--;;
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_admin_id uuid REFERENCES booking_admins(id),
  booking_id uuid REFERENCES bookings(id),
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
--;;
INSERT INTO booking_services
  (id, name_es, name_eu, duration_minutes, price_cents)
VALUES
  ('session_30', 'Sesión de fisioterapia 30 min', 'Fisioterapia saioa 30 min', 30, 3500),
  ('session_60', 'Sesión de fisioterapia 60 min', 'Fisioterapia saioa 60 min', 60, 6000);
