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
  (try
    (let [[payload-part signature] (str/split (or token "") #"\." 2)
          payload (String. (b64-decode payload-part) "UTF-8")
          expected (sign payload)]
      ;; Verify the signature before trusting the payload at all.
      (when (MessageDigest/isEqual (.getBytes expected "UTF-8")
                                   (.getBytes (or signature "") "UTF-8"))
        (let [data (json/parse-string payload true)
              exp (:exp data)]
          (when (and (number? exp)
                     (< (.getEpochSecond (Instant/now)) exp))
            data))))
    (catch Exception _
      nil)))

(defn token-matches? [expected provided]
  (boolean (and (string? expected)
                (string? provided)
                (MessageDigest/isEqual (.getBytes ^String expected "UTF-8")
                                       (.getBytes ^String provided "UTF-8")))))

(def placeholder-hash
  "Verified against when no account matches, so login latency does not
  reveal whether an email exists."
  (password-hash (str (random-uuid))))

(def ^:private max-attempts 5)
(def ^:private attempt-window-seconds 900)

(defonce ^:private login-attempts (atom {}))

(defn- expired-entry? [now {:keys [reset-at]}]
  (not (.isBefore ^Instant now reset-at)))

(defn throttled? [key now]
  (let [{:keys [n] :as entry} (get @login-attempts key)]
    (boolean (and entry
                  (not (expired-entry? now entry))
                  (>= n max-attempts)))))

(defn record-failure! [key now]
  (swap! login-attempts
         (fn [attempts]
           (let [attempts (into {}
                                (remove #(expired-entry? now (val %)))
                                attempts)
                 entry (get attempts key)]
             (assoc attempts key
                    {:n (inc (:n entry 0))
                     :reset-at (or (:reset-at entry)
                                   (.plusSeconds ^Instant now
                                                 attempt-window-seconds))}))))
  nil)

(defn clear-failures! [key]
  (swap! login-attempts dissoc key)
  nil)

(defn bearer-token [request]
  (some-> (get-in request [:headers "authorization"])
          (str/replace #"^Bearer\s+" "")))
