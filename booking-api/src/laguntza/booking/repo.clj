(ns laguntza.booking.repo
  (:require
   [next.jdbc :as jdbc]
   [next.jdbc.result-set :as rs]
   [next.jdbc.sql :as sql]))

(def opts {:builder-fn rs/as-unqualified-lower-maps})

(defn ensure-staff! [ds staff]
  (jdbc/execute-one! ds
                     ["insert into booking_staff (name, email)
                       values (?, ?)
                       on conflict (email) do update
                       set name = excluded.name, active = true
                       returning *"
                      (:name staff) (:email staff)]
                     opts))

(defn ensure-admin! [ds admin]
  (jdbc/execute-one! ds
                     ["insert into booking_admins
                       (staff_id, email, password_hash, role)
                       values (?, ?, ?, ?)
                       on conflict (email) do update
                       set password_hash = excluded.password_hash,
                           active = true
                       returning *"
                      (:staff_id admin)
                      (:email admin)
                      (:password_hash admin)
                      (:role admin)]
                     opts))

(defn services [ds]
  (jdbc/execute! ds
                 ["select * from booking_services
                   where active
                   order by duration_minutes"]
                 opts))

(defn service [ds service-id]
  (jdbc/execute-one! ds
                     ["select * from booking_services where id = ? and active"
                      service-id]
                     opts))

(defn default-staff [ds]
  (jdbc/execute-one! ds
                     ["select * from booking_staff
                       where active
                       order by created_at
                       limit 1"]
                     opts))

(defn availability-windows [ds staff-id day-start day-end]
  (jdbc/execute! ds
                 ["select starts_at, ends_at from availability_windows
                   where staff_id = ? and starts_at < ? and ends_at > ?
                   order by starts_at"
                  staff-id day-end day-start]
                 opts))

(defn busy-intervals [ds staff-id day-start day-end]
  (jdbc/execute! ds
                 ["select starts_at, ends_at from bookings
                   where staff_id = ?
                   and status in ('pending_payment', 'confirmed')
                   and starts_at < ? and ends_at > ?
                   union all
                   select starts_at, ends_at from time_blocks
                   where staff_id = ? and starts_at < ? and ends_at > ?"
                  staff-id day-end day-start staff-id day-end day-start]
                 opts))

(defn admin-by-email [ds email]
  (jdbc/execute-one! ds
                     ["select * from booking_admins where email = ? and active"
                      email]
                     opts))

(defn booking-by-id [ds id]
  (jdbc/execute-one! ds ["select * from bookings where id = ?" id] opts))

(defn booking-by-stripe-session [ds stripe-session-id]
  (jdbc/execute-one! ds
                     ["select * from bookings
                       where stripe_checkout_session_id = ?"
                      stripe-session-id]
                     opts))

(defn create-booking! [tx booking]
  (sql/insert! tx :bookings booking opts))

(defn save-stripe-session! [tx booking-id session]
  (jdbc/execute-one! tx
                     ["update bookings
                       set stripe_checkout_session_id = ?, updated_at = now()
                       where id = ?
                       returning *"
                      (:id session) booking-id]
                     opts))

(defn confirm-paid-booking! [tx stripe-session-id payment-intent-id]
  (jdbc/execute-one! tx
                     ["update bookings
                       set status = 'confirmed',
                           payment_status = 'paid',
                           stripe_payment_intent_id = ?,
                           updated_at = now()
                       where stripe_checkout_session_id = ?
                       returning *"
                      payment-intent-id stripe-session-id]
                     opts))

(defn cancel-booking! [tx id reason]
  (jdbc/execute-one! tx
                     ["update bookings
                       set status = 'cancelled',
                           cancel_reason = ?,
                           cancelled_at = now(),
                           updated_at = now()
                       where id = ?
                       returning *"
                      reason id]
                     opts))

(defn create-availability-window! [tx row]
  (sql/insert! tx :availability_windows row opts))

(defn create-time-block! [tx row]
  (sql/insert! tx :time_blocks row opts))

(defn admin-bookings [ds from to]
  (jdbc/execute! ds
                 ["select * from bookings
                   where starts_at >= ? and starts_at < ?
                   order by starts_at"
                  from to]
                 opts))

(defn enqueue-notification! [tx booking channel event payload]
  (sql/insert! tx
               :notification_outbox
               {:booking_id (:id booking)
                :channel channel
                :event event
                :payload payload}
               opts))

(defn pending-notifications [ds limit]
  (jdbc/execute! ds
                 ["select * from notification_outbox
                   where status = 'pending' and run_after <= now()
                   order by created_at
                   limit ?"
                  limit]
                 opts))

(defn mark-notification-sent! [tx id]
  (jdbc/execute-one! tx
                     ["update notification_outbox
                       set status = 'sent', sent_at = now()
                       where id = ?
                       returning *"
                      id]
                     opts))

(defn mark-notification-failed! [tx id error]
  (jdbc/execute-one! tx
                     ["update notification_outbox
                       set status = 'failed',
                           attempts = attempts + 1,
                           last_error = ?
                       where id = ?
                       returning *"
                      error id]
                     opts))
