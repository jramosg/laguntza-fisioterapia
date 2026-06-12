(ns laguntza.booking.core
  (:require
   [cheshire.core :as json]
   [clojure.java.io :as io]
   [laguntza.booking.config :as config]
   [laguntza.booking.db :as db]
   [laguntza.booking.notifications :as notifications]
   [laguntza.booking.repo :as repo]
   [laguntza.booking.schedule :as schedule]
   [laguntza.booking.security :as security]
   [laguntza.booking.stripe :as stripe]
   [muuntaja.core :as m]
   [next.jdbc :as jdbc]
   [reitit.ring :as ring]
   [reitit.ring.coercion :as coercion]
   [reitit.ring.middleware.muuntaja :as muuntaja]
   [reitit.ring.middleware.parameters :as parameters]
   [ring.adapter.jetty :as jetty]
   [ring.util.http-response :as response])
  (:import
   [java.time Duration Instant]))

(defonce system (atom {}))

(defn- body [request]
  (or (:body-params request)
      (when-let [body-stream (:body request)]
        (json/parse-stream (io/reader body-stream) true))))

(defn- require-ds [request]
  (or (:ds request)
      (throw (ex-info "Database is not configured" {:error :db_missing}))))

(defn- json-error [status error]
  {:status status
   :body {:error error}})

(defn- db-intervals [rows]
  (mapv (fn [{:keys [starts_at ends_at]}]
          {:starts-at starts_at
           :ends-at ends_at})
        rows))

(defn- health [request]
  (response/ok {:ok true
                :database (boolean (:ds request))
                :service "laguntza-booking-api"}))

(defn- services [request]
  (if-let [ds (:ds request)]
    (response/ok {:services (mapv (fn [service]
                                     {:id (:id service)
                                      :duration-minutes
                                      (:duration_minutes service)
                                      :name-es (:name_es service)
                                      :name-eu (:name_eu service)
                                      :price-cents (:price_cents service)
                                      :currency (:currency service)})
                                   (repo/services ds))})
    (response/ok {:services (->> schedule/services vals vec)})))

(defn- availability [{:keys [query-params] :as request}]
  (let [ds (require-ds request)
        service-id (get query-params "service_id" "session_60")
        date (get query-params "date")]
    (cond
      (nil? date)
      (response/bad-request {:error "date_required"})

      (nil? (repo/service ds service-id))
      (response/bad-request {:error "unknown_service"})

      :else
      (let [{day-start :starts-at day-end :ends-at}
            (schedule/day-bounds date)
            staff (repo/default-staff ds)
            windows (db-intervals
                     (repo/availability-windows ds
                                                (:id staff)
                                                day-start
                                                day-end))
            busy (db-intervals (repo/busy-intervals ds
                                                     (:id staff)
                                                     day-start
                                                     day-end))
            slots (schedule/available-slots
                   {:date date
                    :service-id service-id
                    :windows windows
                    :busy-intervals busy
                    :now (Instant/now)})]
        (response/ok
         {:service_id service-id
          :date date
          :slots (mapv (fn [{:keys [starts-at ends-at]}]
                         {:starts_at (str starts-at)
                          :ends_at (str ends-at)
                          :label (schedule/local-slot-label starts-at)})
                       slots)})))))

(defn- booking-row [staff service params source status payment-status]
  (let [starts-at (Instant/parse (:starts_at params))
        ends-at (.plus starts-at
                       (Duration/ofMinutes (:duration_minutes service)))]
    {:staff_id (:id staff)
     :service_id (:id service)
     :source source
     :status status
     :payment_status payment-status
     :patient_name (:patient_name params)
     :patient_email (:patient_email params)
     :patient_phone (:patient_phone params)
     :patient_locale (or (:patient_locale params) "es")
     :terms_accepted_at (when (:terms_accepted params) (Instant/now))
     :starts_at starts-at
     :ends_at ends-at
     :notes (:notes params)}))

(defn- checkout [request]
  (let [ds (require-ds request)
        params (body request)
        service (repo/service ds (:service_id params))
        staff (repo/default-staff ds)]
    (cond
      (nil? service)
      (response/bad-request {:error "unknown_service"})

      (not (:terms_accepted params))
      (response/bad-request {:error "terms_required"})

      :else
      (try
        (jdbc/with-transaction [tx ds]
          (let [booking (repo/create-booking!
                         tx
                         (booking-row staff
                                      service
                                      params
                                      "online"
                                      "pending_payment"
                                      "pending"))
                session (stripe/create-checkout-session! booking service)
                saved (repo/save-stripe-session! tx (:id booking) session)]
            (response/ok {:booking_id (:id saved)
                          :checkout_url (:url session)})))
        (catch Exception e
          (let [data (ex-data e)]
            (if (= :stripe_missing (:error data))
              (json-error 503 "stripe_not_configured")
              (throw e))))))))

(defn- login [request]
  (let [ds (require-ds request)
        {:keys [email password]} (body request)
        admin (repo/admin-by-email ds email)]
    (if (and admin
             (:password_hash admin)
             (security/verify-password? password (:password_hash admin)))
      (response/ok {:token (security/admin-token admin)})
      (json-error 401 "invalid_credentials"))))

(defn- require-admin [handler]
  (fn [request]
    (if-let [admin (some-> request security/bearer-token
                           security/unsign-admin-token)]
      (handler (assoc request :admin admin))
      (json-error 401 "unauthorized"))))

(defn- admin-bookings [{:keys [query-params] :as request}]
  (let [ds (require-ds request)
        from (Instant/parse (get query-params "from"))
        to (Instant/parse (get query-params "to"))]
    (response/ok {:bookings (repo/admin-bookings ds from to)})))

(defn- manual-booking [request]
  (let [ds (require-ds request)
        params (body request)
        service (repo/service ds (:service_id params))
        staff (repo/default-staff ds)]
    (cond
      (nil? service)
      (response/bad-request {:error "unknown_service"})

      :else
      (jdbc/with-transaction [tx ds]
        (let [booking (repo/create-booking!
                       tx
                       (booking-row staff
                                    service
                                    params
                                    "manual"
                                    "confirmed"
                                    "not_required"))]
          (notifications/enqueue-booking-confirmed! tx booking)
          (response/created {:booking booking}))))))

(defn- create-window [request]
  (let [ds (require-ds request)
        params (body request)
        staff (repo/default-staff ds)]
    (jdbc/with-transaction [tx ds]
      (response/created
       {:availability_window
        (repo/create-availability-window!
         tx
         {:staff_id (:id staff)
          :starts_at (Instant/parse (:starts_at params))
          :ends_at (Instant/parse (:ends_at params))
          :note (:note params)})}))))

(defn- create-block [request]
  (let [ds (require-ds request)
        params (body request)
        staff (repo/default-staff ds)]
    (jdbc/with-transaction [tx ds]
      (response/created
       {:time_block
        (repo/create-time-block!
         tx
         {:staff_id (:id staff)
          :starts_at (Instant/parse (:starts_at params))
          :ends_at (Instant/parse (:ends_at params))
          :reason (:reason params)})}))))

(defn- cancel-booking [request]
  (let [ds (require-ds request)
        booking-id (get-in request [:path-params :id])
        booking (repo/booking-by-id ds booking-id)]
    (cond
      (nil? booking)
      (response/not-found {:error "booking_not_found"})

      (not (schedule/cancellable? (Instant/now) (:starts_at booking)))
      (json-error 409 "cancellation_window_closed")

      :else
      (jdbc/with-transaction [tx ds]
        (response/ok {:booking (repo/cancel-booking! tx
                                                      booking-id
                                                      "patient")})))))

(defn- admin-cancel-booking [request]
  (let [ds (require-ds request)
        booking-id (get-in request [:path-params :id])
        params (body request)]
    (jdbc/with-transaction [tx ds]
      (response/ok {:booking (repo/cancel-booking! tx
                                                   booking-id
                                                   (:reason params))}))))

(defn- process-notifications [request]
  (response/ok (notifications/deliver-pending! (require-ds request))))

(defn- stripe-webhook [request]
  (let [ds (require-ds request)
        payload (slurp (:body request))
        event (stripe/verified-event payload
                                     (get-in request
                                             [:headers "stripe-signature"]))
        event-type (:type event)
        object (get-in event [:data :object])]
    (when (= "checkout.session.completed" event-type)
      (jdbc/with-transaction [tx ds]
        (when-let [booking (repo/confirm-paid-booking!
                            tx
                            (:id object)
                            (:payment_intent object))]
          (notifications/enqueue-booking-confirmed! tx booking))))
    (response/ok {:received true})))

(def routes
  [["/api/health" {:get health}]
   ["/api/services" {:get services}]
   ["/api/availability" {:get availability}]
   ["/api/bookings/checkout" {:post checkout}]
   ["/api/bookings/:id/cancel" {:post cancel-booking}]
   ["/api/stripe/webhook" {:post stripe-webhook}]
   ["/api/admin/login" {:post login}]
   ["/api/admin/bookings" {:get {:middleware [require-admin]
                                 :handler admin-bookings}}]
   ["/api/admin/bookings/manual" {:post {:middleware [require-admin]
                                         :handler manual-booking}}]
   ["/api/admin/availability-windows" {:post {:middleware [require-admin]
                                              :handler create-window}}]
   ["/api/admin/time-blocks" {:post {:middleware [require-admin]
                                     :handler create-block}}]
   ["/api/admin/bookings/:id/cancel" {:post {:middleware [require-admin]
                                             :handler admin-cancel-booking}}]
   ["/api/admin/notifications/process"
    {:post {:middleware [require-admin]
            :handler process-notifications}}]])

(defn- wrap-system [handler system-state]
  (fn [request]
    (handler (merge @system-state request))))

(defn- wrap-security-headers [handler]
  (fn [request]
    (let [response (handler request)]
      (update response
              :headers
              merge
              {"X-Content-Type-Options" "nosniff"
               "Referrer-Policy" "strict-origin-when-cross-origin"
               "Cache-Control" "no-store"}))))

(defn- wrap-exceptions [handler]
  (fn [request]
    (try
      (handler request)
      (catch Exception e
        (let [data (ex-data e)
              error (or (:error data) :internal_error)]
          (println (json/generate-string
                    {:level "error"
                     :error (name error)
                     :message (ex-message e)
                     :path (:uri request)}))
          {:status (if (= :db_missing error) 503 500)
           :headers {"content-type" "application/json"}
           :body (json/generate-string {:error (name error)})})))))

(defn- wrap-cors [handler]
  (fn [request]
    (let [origin (get-in request [:headers "origin"])
          allowed? (config/same-origin? origin)
          cors-headers (when allowed?
                         {"Access-Control-Allow-Origin" origin
                          "Vary" "Origin"
                          "Access-Control-Allow-Headers"
                          "authorization,content-type,stripe-signature"
                          "Access-Control-Allow-Methods"
                          "GET,POST,OPTIONS"})]
      (if (= :options (:request-method request))
        {:status 204 :headers cors-headers :body ""}
        (update (handler request) :headers merge cors-headers)))))

(def app
  (-> (ring/ring-handler
       (ring/router
        routes
        {:data {:muuntaja m/instance
                :middleware [parameters/parameters-middleware
                             muuntaja/format-middleware
                             coercion/coerce-exceptions-middleware
                             coercion/coerce-response-middleware
                             coercion/coerce-request-middleware]}})
      (ring/create-default-handler
       {:not-found (fn [_]
                      (response/not-found {:error "not_found"}))}))
      (wrap-system system)
      wrap-exceptions
      wrap-cors
      wrap-security-headers))

(defn start! []
  (let [ds (db/datasource (config/jdbc-url))
        port (config/env-int "PORT" 4000)]
    (when ds
      (db/migrate! ds)
      (let [staff (repo/ensure-staff!
                   ds
                   {:name (or (config/env "BOOKING_STAFF_NAME") "Laguntza")
                    :email (config/admin-email)})]
        (when-let [password-hash (config/admin-password-hash)]
          (repo/ensure-admin! ds
                              {:staff_id (:id staff)
                               :email (config/admin-email)
                               :password_hash password-hash
                               :role "owner"}))))
    (reset! system {:ds ds})
    (println
     (json/generate-string {:service "laguntza-booking-api"
                            :database (boolean ds)
                            :port port}))
    (jetty/run-jetty app {:port port :join? true})))

(defn -main [& _]
  (start!))
