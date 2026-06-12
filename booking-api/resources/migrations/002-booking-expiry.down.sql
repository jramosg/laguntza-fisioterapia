DROP INDEX IF EXISTS bookings_pending_expiry_idx;
--;;
ALTER TABLE bookings DROP COLUMN IF EXISTS expires_at;
