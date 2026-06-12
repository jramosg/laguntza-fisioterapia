(ns laguntza.booking.seed
  (:require
   [laguntza.booking.config :as config]
   [laguntza.booking.db :as db]
   [laguntza.booking.dotenv :as dotenv]
   [laguntza.booking.repo :as repo]
   [laguntza.booking.security :as security]))

(defn -main [& _]
  (dotenv/load!)
  (let [ds (db/datasource (config/jdbc-url))
        email (config/admin-email)
        password "admin123"
        staff (repo/ensure-staff! ds {:name (or (config/env "BOOKING_STAFF_NAME")
                                                "Laguntza Fisioterapia")
                                      :email email})]
    (repo/ensure-admin! ds {:staff_id (:id staff)
                            :email email
                            :password_hash (security/password-hash password)
                            :role "owner"})
    (println (str "Admin ready — " email " / " password))
    (System/exit 0)))
