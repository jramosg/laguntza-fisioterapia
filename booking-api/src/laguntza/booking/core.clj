(ns laguntza.booking.core
  (:require
   [cheshire.core :as json]
   [clojure.java.io :as io]
   [clojure.string :as str]
   [laguntza.booking.config :as config]
   [laguntza.booking.dotenv :as dotenv]
   [laguntza.booking.db :as db]
   [laguntza.booking.notifications :as notifications]
   [laguntza.booking.repo :as repo]
   [laguntza.booking.schedule :as schedule]
   [laguntza.booking.security :as security]
   [laguntza.booking.stripe :as stripe]
   [laguntza.booking.validate :as validate]
   [muuntaja.core :as m]
   [next.jdbc :as jdbc]
   [reitit.ring :as ring]
   [reitit.ring.coercion :as coercion]
   [reitit.ring.middleware.muuntaja :as muuntaja]
   [reitit.ring.middleware.parameters :as parameters]
   [ring.adapter.jetty :as jetty]
   [ring.util.http-response :as response])
  (:import
   [java.io ByteArrayInputStream]
   [java.sql SQLException]
   [java.time Duration Instant]))

(defonce system (atom {}))

(defn- log! [data]
  (println (json/generate-string data)))

(defn- body [request]
  (try
    (or (:body-params request)
        (when-let [body-stream (:body request)]
          (json/parse-stream (io/reader body-stream) true))
        {})
    (catch Exception _
      (throw (ex-info "Invalid JSON body" {:error :invalid_json})))))

(defn- require-ds [request]
  (or (:ds request)
      (throw (ex-info "Database is not configured" {:error :db_missing}))))

(defn- json-error [status error]
  {:status status
   :body {:error error}})

(defn- db-intervals [rows]
  (mapv (fn [{:keys [starts_at ends_at]}]
          {:starts-at (schedule/->instant starts_at)
           :ends-at (schedule/->instant ends_at)})
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

(defn- open-slots [ds staff service date]
  (let [{day-start :starts-at day-end :ends-at} (schedule/day-bounds date)
        windows (db-intervals
                 (repo/availability-windows ds (:id staff)
                                            day-start day-end))
        recurring (mapv #(schedule/day-window date
                                              (:start_time %)
                                              (:end_time %))
                        (repo/recurring-windows-for-weekday
                         ds (:id staff) (schedule/weekday date)))
        busy (db-intervals
              (repo/busy-intervals ds (:id staff) day-start day-end))]
    (schedule/available-slots
     {:date date
      :service-id (:id service)
      :duration-minutes (:duration_minutes service)
      :windows (into windows recurring)
      :busy-intervals busy
      :now (Instant/now)})))

(defn- availability [{:keys [query-params] :as request}]
  (let [ds (require-ds request)
        service-id (get query-params "service_id" "session_60")
        date (validate/parse-date (get query-params "date"))
        service (repo/service ds service-id)]
    (cond
      (nil? date)
      (response/bad-request {:error "invalid_date"})

      (nil? service)
      (response/bad-request {:error "unknown_service"})

      :else
      (response/ok
       {:service_id service-id
        :date (str date)
        :slots (mapv (fn [{:keys [starts-at ends-at]}]
                       {:starts_at (str starts-at)
                        :ends_at (str ends-at)
                        :label (schedule/local-slot-label starts-at)})
                     (open-slots ds (repo/default-staff ds)
                                 service date))}))))

(defn- booking-row
  [staff service starts-at params source status payment-status]
  (let [ends-at (.plus ^Instant starts-at
                       (Duration/ofMinutes (:duration_minutes service)))]
    {:staff_id (:id staff)
     :service_id (:id service)
     :source source
     :status status
     :payment_status payment-status
     :patient_name (str/trim (:patient_name params))
     :patient_email (-> (:patient_email params) str/trim str/lower-case)
     :patient_phone (some-> (:patient_phone params) str/trim)
     :patient_locale (validate/locale (:patient_locale params))
     :terms_accepted_at (when (:terms_accepted params) (Instant/now))
     :starts_at starts-at
     :ends_at ends-at
     :notes (:notes params)}))

(def ^:private pending-hold
  "How long an unpaid online booking keeps its slot. Slightly longer
  than the Stripe session lifetime so a session always expires before
  the hold does."
  (Duration/ofMinutes (+ stripe/session-minutes 5)))

(defn- overlap-violation? [e]
  (boolean (->> (iterate #(.getCause ^Throwable %) e)
                (take-while some?)
                (some #(and (instance? SQLException %)
                            (= "23P01"
                               (.getSQLState ^SQLException %)))))))

(defn- insert-booking!
  "Insert a booking, returning nil when the slot was taken concurrently
  (the bookings_no_overlap exclusion constraint fired)."
  [ds row]
  (try
    (jdbc/with-transaction [tx ds]
      (repo/create-booking! tx row))
    (catch Exception e
      (when-not (overlap-violation? e)
        (throw e)))))

(defn- start-checkout! [ds booking service]
  (try
    (let [session (stripe/create-checkout-session! booking service)]
      (repo/save-stripe-session! ds (:id booking) session)
      (response/ok {:booking_id (:id booking)
                    :checkout_url (:url session)}))
    (catch Exception e
      (repo/cancel-booking! ds (:id booking) "checkout_error")
      (if (= :stripe_missing (:error (ex-data e)))
        (json-error 503 "stripe_not_configured")
        (throw e)))))

(defn- checkout [request]
  (let [ds (require-ds request)
        params (body request)
        service (repo/service ds (:service_id params))
        staff (repo/default-staff ds)
        param-error (validate/booking-params-error params)]
    (cond
      (nil? service)
      (response/bad-request {:error "unknown_service"})

      (not (:terms_accepted params))
      (response/bad-request {:error "terms_required"})

      (some? param-error)
      (response/bad-request {:error (name param-error)})

      :else
      (let [starts-at (validate/parse-instant (:starts_at params))
            date (schedule/instant->local-date starts-at)]
        (repo/expire-stale-pending! ds)
        (if-not (some #(= starts-at (:starts-at %))
                      (open-slots ds staff service date))
          (json-error 409 "slot_unavailable")
          (let [row (assoc (booking-row staff service starts-at params
                                        "online" "pending_payment"
                                        "pending")
                           :expires_at (.plus (Instant/now) pending-hold))]
            (if-let [booking (insert-booking! ds row)]
              (start-checkout! ds booking service)
              (json-error 409 "slot_unavailable"))))))))

(defn- client-ip [request]
  (or (some-> (get-in request [:headers "x-forwarded-for"])
              (str/split #",")
              first
              str/trim)
      (:remote-addr request)))

(defn- login [request]
  (let [ds (require-ds request)
        {:keys [email password]} (body request)
        email (some-> email str/trim str/lower-case)
        now (Instant/now)
        ip-key (str "ip:" (client-ip request))
        email-key (str "email:" email)]
    (cond
      (or (not (validate/text? email 254))
          (not (string? password)))
      (json-error 400 "invalid_request")

      (or (security/throttled? ip-key now)
          (security/throttled? email-key now))
      (json-error 429 "too_many_attempts")

      :else
      (let [admin (repo/admin-by-email ds email)
            hash (or (:password_hash admin) security/placeholder-hash)
            valid? (security/verify-password? password hash)]
        (if (and admin valid?)
          (do (security/clear-failures! email-key)
              (response/ok {:token (security/admin-token admin)}))
          (do (security/record-failure! ip-key now)
              (security/record-failure! email-key now)
              (json-error 401 "invalid_credentials")))))))

(defn- require-admin [handler]
  (fn [request]
    (if-let [admin (some-> request security/bearer-token
                           security/unsign-admin-token)]
      (handler (assoc request :admin admin))
      (json-error 401 "unauthorized"))))

(defn- admin-bookings [{:keys [query-params] :as request}]
  (let [ds (require-ds request)
        from (validate/parse-instant (get query-params "from"))
        to (validate/parse-instant (get query-params "to"))]
    (if (and from to (.isBefore from to))
      (response/ok {:bookings (repo/admin-bookings ds from to)})
      (response/bad-request {:error "invalid_range"}))))

(defn- manual-booking [request]
  (let [ds (require-ds request)
        params (body request)
        service (repo/service ds (:service_id params))
        staff (repo/default-staff ds)
        param-error (validate/booking-params-error params)]
    (cond
      (nil? service)
      (response/bad-request {:error "unknown_service"})

      (some? param-error)
      (response/bad-request {:error (name param-error)})

      :else
      (let [starts-at (validate/parse-instant (:starts_at params))
            row (booking-row staff service starts-at params
                             "manual" "confirmed" "not_required")]
        (try
          (jdbc/with-transaction [tx ds]
            (let [booking (repo/create-booking! tx row)]
              (notifications/enqueue-booking-confirmed! tx booking)
              {:status 201 :body {:booking booking}}))
          (catch Exception e
            (if (overlap-violation? e)
              (json-error 409 "slot_unavailable")
              (throw e))))))))

(defn- interval-params [params]
  (let [starts (validate/parse-instant (:starts_at params))
        ends (validate/parse-instant (:ends_at params))]
    (when (and starts ends (.isBefore starts ends))
      {:starts_at starts :ends_at ends})))

(defn- create-window [request]
  (let [ds (require-ds request)
        params (body request)
        staff (repo/default-staff ds)]
    (if-let [interval (interval-params params)]
      (jdbc/with-transaction [tx ds]
        {:status 201
         :body {:availability_window
                (repo/create-availability-window!
                 tx
                 (assoc interval
                        :staff_id (:id staff)
                        :note (:note params)))}})
      (response/bad-request {:error "invalid_interval"}))))

(defn- create-block [request]
  (let [ds (require-ds request)
        params (body request)
        staff (repo/default-staff ds)]
    (if-let [interval (interval-params params)]
      (jdbc/with-transaction [tx ds]
        {:status 201
         :body {:time_block
                (repo/create-time-block!
                 tx
                 (assoc interval
                        :staff_id (:id staff)
                        :reason (:reason params)))}})
      (response/bad-request {:error "invalid_interval"}))))

(defn- recurring-window-json [row]
  {:id (:id row)
   :weekday (:weekday row)
   :start_time (str (schedule/->local-time (:start_time row)))
   :end_time (str (schedule/->local-time (:end_time row)))
   :note (:note row)})

(defn- list-recurring-windows [request]
  (let [ds (require-ds request)
        staff (repo/default-staff ds)]
    (response/ok {:recurring_windows
                  (mapv recurring-window-json
                        (repo/recurring-windows ds (:id staff)))})))

(defn- create-recurring-window [request]
  (let [ds (require-ds request)
        params (body request)
        staff (repo/default-staff ds)
        weekday (:weekday params)
        start (validate/parse-local-time (:start_time params))
        end (validate/parse-local-time (:end_time params))]
    (if (and (validate/weekday? weekday)
             start
             end
             (.isBefore start end)
             (validate/optional-text? (:note params) 200))
      (jdbc/with-transaction [tx ds]
        {:status 201
         :body {:recurring_window
                (recurring-window-json
                 (repo/create-recurring-window!
                  tx
                  {:staff_id (:id staff)
                   :weekday weekday
                   :start_time start
                   :end_time end
                   :note (:note params)}))}})
      (response/bad-request {:error "invalid_recurring_window"}))))

(defn- deactivate-recurring-window [request]
  (let [ds (require-ds request)
        id (some-> (get-in request [:path-params :id]) parse-uuid)
        row (when id
              (jdbc/with-transaction [tx ds]
                (repo/deactivate-recurring-window! tx id)))]
    (if row
      (response/ok {:recurring_window (recurring-window-json row)})
      (response/not-found {:error "recurring_window_not_found"}))))

(defn- cancel-booking [request]
  (let [ds (require-ds request)
        booking-id (some-> (get-in request [:path-params :id]) parse-uuid)
        token (:token (body request))
        booking (when booking-id (repo/booking-by-id ds booking-id))]
    (cond
      ;; Same answer for a missing booking and a bad token, so the
      ;; endpoint leaks nothing about which bookings exist.
      (or (nil? booking)
          (not (security/token-matches? (:public_token booking) token)))
      (response/not-found {:error "booking_not_found"})

      (not (schedule/cancellable? (Instant/now) (:starts_at booking)))
      (json-error 409 "cancellation_window_closed")

      :else
      (if-let [cancelled (jdbc/with-transaction [tx ds]
                           (repo/cancel-booking! tx booking-id
                                                 "patient"))]
        (response/ok {:booking cancelled})
        (json-error 409 "booking_not_active")))))

(defn- admin-cancel-booking [request]
  (let [ds (require-ds request)
        booking-id (some-> (get-in request [:path-params :id]) parse-uuid)
        reason (:reason (body request))]
    (cond
      (not (validate/optional-text? reason 200))
      (response/bad-request {:error "invalid_reason"})

      (nil? booking-id)
      (response/not-found {:error "booking_not_found"})

      :else
      (if-let [booking (jdbc/with-transaction [tx ds]
                         (repo/cancel-booking! tx booking-id
                                               (or reason "admin")))]
        (response/ok {:booking booking})
        (response/not-found {:error "booking_not_found"})))))

(defn- process-notifications [request]
  (response/ok (notifications/deliver-pending! (require-ds request))))

(defn- stripe-webhook [request]
  (let [ds (require-ds request)
        payload (or (:raw-body request) "")
        event (stripe/verified-event payload
                                     (get-in request
                                             [:headers "stripe-signature"]))
        event-type (:type event)
        object (get-in event [:data :object])]
    (when (= "checkout.session.completed" event-type)
      (jdbc/with-transaction [tx ds]
        (if-let [booking (repo/confirm-paid-booking!
                          tx
                          (:id object)
                          (:payment_intent object))]
          (notifications/enqueue-booking-confirmed! tx booking)
          (log! {:level "warn"
                 :event "stripe_session_without_pending_booking"
                 :session_id (:id object)}))))
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
   ["/api/admin/recurring-windows"
    {:get {:middleware [require-admin]
           :handler list-recurring-windows}
     :post {:middleware [require-admin]
            :handler create-recurring-window}}]
   ["/api/admin/recurring-windows/:id/deactivate"
    {:post {:middleware [require-admin]
            :handler deactivate-recurring-window}}]
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
               "X-Frame-Options" "DENY"
               "Strict-Transport-Security"
               "max-age=31536000; includeSubDomains"
               "Referrer-Policy" "strict-origin-when-cross-origin"
               "Cache-Control" "no-store"}))))

(def ^:private error-status
  {:db_missing 503
   :invalid_json 400
   :invalid_stripe_signature 400
   :stripe_webhook_missing 503})

(defn- wrap-exceptions [handler]
  (fn [request]
    (try
      (handler request)
      (catch Exception e
        (let [data (ex-data e)
              error (cond
                      (= :muuntaja/decode (:type data)) :invalid_json
                      (keyword? (:error data)) (:error data)
                      :else :internal_error)]
          (log! {:level "error"
                 :error (name error)
                 :message (ex-message e)
                 :path (:uri request)})
          {:status (get error-status error 500)
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

(def ^:private max-body-bytes 65536)

(defn- wrap-body-limit [handler]
  (fn [request]
    (let [length (some-> (get-in request [:headers "content-length"])
                         parse-long)]
      (if (and length (> length max-body-bytes))
        {:status 413
         :headers {"content-type" "application/json"}
         :body (json/generate-string {:error "payload_too_large"})}
        (handler request)))))

(defn- wrap-raw-webhook-body
  "Stripe signs the exact raw request bytes, so keep them around before
  the JSON middleware consumes the body stream."
  [handler]
  (fn [request]
    (if (and (= "/api/stripe/webhook" (:uri request))
             (:body request))
      (let [raw (slurp (:body request))]
        (handler (assoc request
                        :raw-body raw
                        :body (ByteArrayInputStream.
                               (.getBytes raw "UTF-8")))))
      (handler request))))

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
      wrap-raw-webhook-body
      wrap-body-limit
      wrap-exceptions
      wrap-cors
      wrap-security-headers))

(defn start! []
  (dotenv/load!)
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
    (log! {:service "laguntza-booking-api"
           :database (boolean ds)
           :port port})
    (jetty/run-jetty app {:port port :join? true})))

(defn -main [& _]
  (start!))
