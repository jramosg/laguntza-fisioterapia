CREATE TABLE
  recurring_windows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
    staff_id uuid NOT NULL REFERENCES booking_staff (id),
    weekday integer NOT NULL CHECK (weekday BETWEEN 1 AND 7),
    start_time time NOT NULL,
    end_time time NOT NULL,
    note text,
    active boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES booking_admins (id),
    created_at timestamptz NOT NULL DEFAULT now (),
    CHECK (end_time > start_time)
  );

--;;
CREATE INDEX recurring_windows_staff_weekday_idx ON recurring_windows (staff_id, weekday)
WHERE
  active;