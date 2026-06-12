(ns laguntza.booking.db
  (:require
   [laguntza.booking.config :as config]
   [migratus.core :as migratus]
   ;; Loading this namespace teaches the PostgreSQL driver to bind
   ;; java.time.Instant parameters as SQL timestamps.
   [next.jdbc.date-time])
  (:import
   [com.zaxxer.hikari HikariConfig HikariDataSource]))

(defn datasource [jdbc-url]
  (when jdbc-url
    (let [cfg (doto (HikariConfig.)
                (.setJdbcUrl jdbc-url)
                (.setMaximumPoolSize (config/env-int "DB_POOL_SIZE" 10))
                (.setPoolName "laguntza-booking"))]
      (HikariDataSource. cfg))))

(defn migratus-config [ds]
  {:store :database
   :migration-dir "migrations"
   :db {:datasource ds}})

(defn migrate! [ds]
  (when ds
    (migratus/migrate (migratus-config ds))))
