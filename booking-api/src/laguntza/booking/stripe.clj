(ns laguntza.booking.stripe
  (:require
   [cheshire.core :as json]
   [clojure.string :as str]
   [laguntza.booking.config :as config])
  (:import
   [java.net URI URLEncoder]
   [java.net.http HttpClient HttpRequest HttpRequest$BodyPublishers
    HttpResponse$BodyHandlers]
   [java.security MessageDigest]
   [java.time Instant]
   [javax.crypto Mac]
   [javax.crypto.spec SecretKeySpec]))

(defn- encode-param [[k v]]
  (str (URLEncoder/encode (name k) "UTF-8")
       "="
       (URLEncoder/encode (str v) "UTF-8")))

(defn- form-body [params]
  (->> params
       (remove (comp nil? second))
       (map encode-param)
       (str/join "&")))

(def session-minutes
  "Stripe's minimum checkout-session lifetime. Pending bookings hold
  their slot slightly longer than this so a session can never be paid
  after the hold has been released."
  30)

(defn create-checkout-session! [booking service]
  (let [secret (config/stripe-secret-key)
        site-url (config/public-site-url)
        locale (or (:patient_locale booking) "es")
        return-url (str site-url "/" locale "/book")]
    (when-not secret
      (throw (ex-info "Stripe is not configured" {:error :stripe_missing})))
    (let [body (form-body
                {"mode" "payment"
                 "success_url" (str return-url "?booking=success")
                 "cancel_url" (str return-url "?booking=cancelled")
                 "expires_at" (+ (.getEpochSecond (Instant/now))
                                 (* 60 (inc session-minutes)))
                 "client_reference_id" (:id booking)
                 "customer_email" (:patient_email booking)
                 "line_items[0][price_data][currency]" (:currency service)
                 "line_items[0][price_data][unit_amount]"
                 (:price_cents service)
                 "line_items[0][price_data][product_data][name]"
                 (:name_es service)
                 "line_items[0][quantity]" 1
                 "metadata[booking_id]" (:id booking)})
          request (-> (HttpRequest/newBuilder)
                      (.uri (URI/create
                             "https://api.stripe.com/v1/checkout/sessions"))
                      (.header "Authorization" (str "Bearer " secret))
                      (.header "Content-Type"
                               "application/x-www-form-urlencoded")
                      (.POST (HttpRequest$BodyPublishers/ofString body))
                      (.build))
          response (.send (HttpClient/newHttpClient)
                          request
                          (HttpResponse$BodyHandlers/ofString))
          payload (json/parse-string (.body response) true)]
      (if (< (.statusCode response) 300)
        payload
        (throw (ex-info "Stripe checkout failed"
                        {:status (.statusCode response)
                         :payload payload}))))))

(defn- hmac [secret payload]
  (let [mac (Mac/getInstance "HmacSHA256")]
    (.init mac (SecretKeySpec. (.getBytes secret "UTF-8") "HmacSHA256"))
    (.doFinal mac (.getBytes payload "UTF-8"))))

(defn- hex [bytes]
  (apply str (map #(format "%02x" (bit-and % 0xff)) bytes)))

(defn- signature-parts [header]
  (->> (str/split (or header "") #",")
       (map #(str/split % #"=" 2))
       (reduce (fn [acc [k v]] (update acc k conj v)) {})))

(defn verified-event [payload signature-header]
  (let [secret (config/stripe-webhook-secret)
        parts (signature-parts signature-header)
        timestamp (some-> (first (get parts "t")) parse-long)
        signed-payload (str timestamp "." payload)
        expected (hex (hmac secret signed-payload))
        signatures (set (get parts "v1"))]
    (when-not secret
      (throw (ex-info "Stripe webhook secret is not configured"
                      {:error :stripe_webhook_missing})))
    (when-not (and timestamp
                   (< (abs (- (.getEpochSecond (Instant/now)) timestamp)) 300)
                   (some #(MessageDigest/isEqual (.getBytes expected "UTF-8")
                                                 (.getBytes % "UTF-8"))
                         signatures))
      (throw (ex-info "Invalid Stripe signature"
                      {:error :invalid_stripe_signature})))
    (json/parse-string payload true)))
