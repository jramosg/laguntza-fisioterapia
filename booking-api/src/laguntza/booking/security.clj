(ns laguntza.booking.security
  (:require
   [cheshire.core :as json]
   [clojure.string :as str]
   [laguntza.booking.config :as config])
  (:import
   [java.security MessageDigest SecureRandom]
   [java.time Instant]
   [java.util Base64]
   [javax.crypto Mac SecretKeyFactory]
   [javax.crypto.spec PBEKeySpec SecretKeySpec]))

(def ^:private iterations 210000)
(def ^:private key-length 256)

(defn- b64-encode [bytes]
  (.encodeToString (Base64/getUrlEncoder) bytes))

(defn- b64-decode [value]
  (.decode (Base64/getUrlDecoder) value))

(defn- random-bytes [n]
  (let [bytes (byte-array n)]
    (.nextBytes (SecureRandom.) bytes)
    bytes))

(defn- pbkdf2 [password salt iteration-count]
  (let [factory (SecretKeyFactory/getInstance "PBKDF2WithHmacSHA256")
        spec (PBEKeySpec. (char-array password)
                          salt
                          iteration-count
                          key-length)]
    (.. factory (generateSecret spec) getEncoded)))

(defn password-hash [password]
  (let [salt (random-bytes 16)
        hash (pbkdf2 password salt iterations)]
    (str "pbkdf2$" iterations "$" (b64-encode salt) "$" (b64-encode hash))))

(defn verify-password? [password encoded]
  (let [[scheme iteration-text salt-text hash-text] (str/split encoded #"\$")
        iteration-count (parse-long iteration-text)
        expected (b64-decode hash-text)
        actual (pbkdf2 password (b64-decode salt-text) iteration-count)]
    (and (= "pbkdf2" scheme)
         (MessageDigest/isEqual expected actual))))

(defn- hmac-sha256 [secret payload]
  (let [mac (Mac/getInstance "HmacSHA256")]
    (.init mac (SecretKeySpec. (.getBytes secret "UTF-8") "HmacSHA256"))
    (.doFinal mac (.getBytes payload "UTF-8"))))

(defn sign [payload]
  (b64-encode (hmac-sha256 (config/session-secret) payload)))

(defn admin-token [admin]
  (let [payload (json/generate-string
                 {:sub (str (:id admin))
                  :email (:email admin)
                  :role (:role admin)
                  :exp (+ (.getEpochSecond (Instant/now)) (* 8 60 60))})]
    (str (b64-encode (.getBytes payload "UTF-8")) "." (sign payload))))

(defn unsign-admin-token [token]
  (let [[payload-part signature] (str/split (or token "") #"\.")
        payload (String. (b64-decode payload-part) "UTF-8")
        expected (sign payload)
        data (json/parse-string payload true)]
    (when (and (MessageDigest/isEqual (.getBytes expected "UTF-8")
                                      (.getBytes signature "UTF-8"))
               (< (.getEpochSecond (Instant/now)) (:exp data)))
      data)))

(defn bearer-token [request]
  (some-> (get-in request [:headers "authorization"])
          (str/replace #"^Bearer\s+" "")))
