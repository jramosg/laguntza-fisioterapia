-- Dev seed: creates admin account  email=info@laguntzafisioterapia.com  password=admin123
-- Usage: docker exec -i booking-api-postgres-1 psql -U booking_app -d laguntza_booking < resources/dev-seed.sql

INSERT INTO booking_staff (name, email)
VALUES ('Laguntza Fisioterapia', 'info@laguntzafisioterapia.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO booking_admins (staff_id, email, password_hash, role)
SELECT id,
       'info@laguntzafisioterapia.com',
       'pbkdf2$210000$0XU7hNSlv_zDZbL-JnggvQ==$KIGewCq59roUH-YWX2rdk_NeryH8uGb7xnwzUjLnth4=',
       'owner'
FROM   booking_staff
WHERE  email = 'info@laguntzafisioterapia.com'
ON CONFLICT (email) DO NOTHING;
