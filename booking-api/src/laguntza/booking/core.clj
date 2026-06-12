(ns laguntza.booking.core
  (:require
   [cheshire.core :as json]
   [laguntza.booking.schedule :as schedule]
   [muuntaja.core :as m]
   [reitit.ring :as ring]
   [reitit.ring.coercion :as coercion]
   [reitit.ring.middleware.parameters :as parameters]
   [reitit.ring.middleware.muuntaja :as muuntaja]
   [ring.adapter.jetty :as jetty]
   [ring.util.http-response :as response])
  (:import
   [java.time Instant]))

(defn- service-response []
  (->> schedule/services
       vals
       (sort-by :duration-minutes)
       vec))

(defn- sample-windows [date]
  (let [{:keys [starts-at]} (schedule/day-bounds date)
        hour-ms (* 60 60 1000)]
    [{:starts-at (.plusMillis starts-at (* 10 hour-ms))
      :ends-at (.plusMillis starts-at (* 14 hour-ms))}]))

(defn- sample-busy [date]
  (let [{:keys [starts-at]} (schedule/day-bounds date)
        hour-ms (* 60 60 1000)]
    [{:starts-at (.plusMillis starts-at (* 11 hour-ms))
      :ends-at (.plusMillis starts-at (* 12 hour-ms))}]))

(defn- health [_]
  (response/ok {:ok true
                :service "laguntza-booking-api"}))

(defn- services [_]
  (response/ok {:services (service-response)}))

(defn- availability [{:keys [query-params]}]
  (let [service-id (get query-params "service_id" "session_60")
        date (get query-params "date")]
    (cond
      (nil? date)
      (response/bad-request {:error "date_required"})

      (nil? (get schedule/services service-id))
      (response/bad-request {:error "unknown_service"})

      :else
      (let [slots (schedule/available-slots
                   {:date date
                    :service-id service-id
                    :windows (sample-windows date)
                    :busy-intervals (sample-busy date)
                    :now (Instant/now)})]
        (response/ok
         {:service_id service-id
          :date date
          :slots (mapv (fn [{:keys [starts-at ends-at]}]
                         {:starts_at (str starts-at)
                          :ends_at (str ends-at)
                          :label (schedule/local-slot-label starts-at)})
                       slots)})))))

(defn- checkout [_]
  (response/accepted
   {:status "not_implemented"
    :message "Stripe checkout will be created server-side here."}))

(defn- stripe-webhook [request]
  (let [payload (slurp (:body request))]
    (response/ok {:received true
                  :bytes (count payload)})))

(def routes
  [["/api/health" {:get health}]
   ["/api/services" {:get services}]
   ["/api/availability" {:get availability}]
   ["/api/bookings/checkout" {:post checkout}]
   ["/api/stripe/webhook" {:post stripe-webhook}]])

(def app
  (ring/ring-handler
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
                  (response/not-found {:error "not_found"}))})))

(defn -main [& _]
  (let [port (parse-long (or (System/getenv "PORT") "4000"))]
    (println
     (json/generate-string {:service "laguntza-booking-api"
                            :port port}))
    (jetty/run-jetty app {:port port :join? true})))
