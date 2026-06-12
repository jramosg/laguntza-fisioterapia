(ns laguntza.booking.core-test
  (:require
   [clojure.java.io :as io]
   [clojure.test :refer [deftest is use-fixtures]]
   [laguntza.booking.config :as config]
   [laguntza.booking.core :as core])
  (:import
   [java.time Instant]
   [javax.crypto Mac]
   [javax.crypto.spec SecretKeySpec]))

(use-fixtures :each
  (fn [run-test]
    (reset! core/system {:ds ::fake})
    (try
      (run-test)
      (finally
        (reset! core/system {})))))

(defn- request [method uri & {:as extra}]
  (merge {:request-method method
          :uri uri
          :headers {}}
         extra))

(defn- json-request [method uri body-str & {:keys [headers]}]
  (request method uri
           :headers (merge {"content-type" "application/json"}
                           headers)
           :body (io/input-stream (.getBytes ^String body-str "UTF-8"))))

(deftest health-endpoint
  (is (= 200 (:status (core/app (request :get "/api/health"))))))

(deftest unknown-route-is-404
  (is (= 404 (:status (core/app (request :get "/api/nope"))))))

(deftest admin-routes-require-token
  (is (= 401 (:status (core/app (request :get "/api/admin/bookings")))))
  (is (= 401 (:status (core/app
                       (request :get "/api/admin/bookings"
                                :headers {"authorization"
                                          "Bearer garbage.token"}))))))

(deftest oversized-bodies-are-rejected
  (let [response (core/app (request :post "/api/bookings/checkout"
                                    :headers {"content-length"
                                              "9999999"}))]
    (is (= 413 (:status response)))))

(deftest security-headers-are-present
  (let [{:keys [headers]} (core/app (request :get "/api/health"))]
    (is (= "nosniff" (get headers "X-Content-Type-Options")))
    (is (= "no-store" (get headers "Cache-Control")))
    (is (some? (get headers "Strict-Transport-Security")))))

(deftest cors-only-reflects-the-configured-origin
  (let [evil (core/app (request :options "/api/availability"
                                :headers {"origin" "https://evil.test"}))
        ok (core/app (request :options "/api/availability"
                              :headers {"origin"
                                        (config/public-site-url)}))]
    (is (nil? (get-in evil [:headers "Access-Control-Allow-Origin"])))
    (is (some? (get-in ok [:headers "Access-Control-Allow-Origin"])))))

(defn- stripe-signature [secret payload timestamp]
  (let [mac (doto (Mac/getInstance "HmacSHA256")
              (.init (SecretKeySpec. (.getBytes ^String secret "UTF-8")
                                     "HmacSHA256")))
        digest (.doFinal mac (.getBytes (str timestamp "." payload)
                                        "UTF-8"))]
    (str "t=" timestamp
         ",v1=" (apply str (map #(format "%02x" (bit-and % 0xff))
                                digest)))))

(deftest stripe-webhook-verifies-the-raw-body
  ;; Goes through the full middleware stack on purpose: the signature
  ;; must be checked against the raw bytes even though muuntaja also
  ;; parses the JSON body.
  (with-redefs [config/stripe-webhook-secret (constantly "whsec_test")]
    (let [payload "{\"type\":\"ping\",\"data\":{\"object\":{}}}"
          now (.getEpochSecond (Instant/now))
          good (json-request :post "/api/stripe/webhook" payload
                             :headers {"stripe-signature"
                                       (stripe-signature "whsec_test"
                                                         payload
                                                         now)})
          bad (json-request :post "/api/stripe/webhook" payload
                            :headers {"stripe-signature"
                                      (stripe-signature "whsec_wrong"
                                                        payload
                                                        now)})
          stale (json-request :post "/api/stripe/webhook" payload
                              :headers {"stripe-signature"
                                        (stripe-signature "whsec_test"
                                                          payload
                                                          (- now 3600))})]
      (is (= 200 (:status (core/app good))))
      (is (= 400 (:status (core/app bad))))
      (is (= 400 (:status (core/app stale)))))))

(deftest malformed-json-is-a-400
  (let [response (core/app (json-request :post "/api/bookings/checkout"
                                         "{not json"))]
    (is (= 400 (:status response)))))
