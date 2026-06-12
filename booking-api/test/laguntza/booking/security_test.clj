(ns laguntza.booking.security-test
  (:require
   [clojure.string :as str]
   [clojure.test :refer [deftest is]]
   [laguntza.booking.security :as security])
  (:import
   [java.time Instant]
   [java.util Base64]))

(deftest password-hash-roundtrip
  (let [hash (security/password-hash "correct horse")]
    (is (security/verify-password? "correct horse" hash))
    (is (not (security/verify-password? "wrong horse" hash)))))

(deftest admin-token-roundtrip
  (let [token (security/admin-token {:id "admin-1"
                                     :email "info@example.com"
                                     :role "owner"})
        data (security/unsign-admin-token token)]
    (is (= "admin-1" (:sub data)))
    (is (= "info@example.com" (:email data)))
    (is (= "owner" (:role data)))))

(deftest malformed-tokens-are-rejected-without-throwing
  (is (nil? (security/unsign-admin-token nil)))
  (is (nil? (security/unsign-admin-token "")))
  (is (nil? (security/unsign-admin-token "garbage")))
  (is (nil? (security/unsign-admin-token "no-signature.")))
  (is (nil? (security/unsign-admin-token "!!not-base64!!.sig"))))

(deftest tampered-token-is-rejected
  (let [token (security/admin-token {:id "admin-1"
                                     :email "info@example.com"
                                     :role "owner"})
        [_ signature] (str/split token #"\." 2)
        forged-payload "{\"sub\":\"evil\",\"role\":\"owner\",\"exp\":9999999999}"
        forged (str (.encodeToString (Base64/getUrlEncoder)
                                     (.getBytes forged-payload "UTF-8"))
                    "." signature)]
    (is (nil? (security/unsign-admin-token forged)))))

(deftest expired-token-is-rejected
  (let [payload (format "{\"sub\":\"admin-1\",\"exp\":%d}"
                        (- (.getEpochSecond (Instant/now)) 10))
        token (str (.encodeToString (Base64/getUrlEncoder)
                                    (.getBytes payload "UTF-8"))
                   "." (security/sign payload))]
    (is (nil? (security/unsign-admin-token token)))))

(deftest public-token-comparison
  (is (security/token-matches? "abc123" "abc123"))
  (is (not (security/token-matches? "abc123" "abc124")))
  (is (not (security/token-matches? "abc123" nil)))
  (is (not (security/token-matches? nil "abc123"))))

(deftest login-throttling
  (let [key (str "test:" (random-uuid))
        now (Instant/now)]
    (is (not (security/throttled? key now)))
    (dotimes [_ 5]
      (security/record-failure! key now))
    (is (security/throttled? key now))
    (is (not (security/throttled? key (.plusSeconds now 901))))
    (security/clear-failures! key)
    (is (not (security/throttled? key now)))))
