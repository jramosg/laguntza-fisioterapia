(ns laguntza.booking.validate
  (:require
   [clojure.string :as str])
  (:import
   [java.time Instant LocalDate LocalTime]))

(defn parse-instant [value]
  (when (string? value)
    (try
      (Instant/parse value)
      (catch Exception _ nil))))

(defn parse-date [value]
  (when (string? value)
    (try
      (LocalDate/parse value)
      (catch Exception _ nil))))

(defn parse-local-time [value]
  (when (string? value)
    (try
      (LocalTime/parse value)
      (catch Exception _ nil))))

(defn weekday? [value]
  (and (int? value) (<= 1 value 7)))

(def ^:private email-re #"[^@\s]{1,64}@[^@\s]+\.[^@\s]{2,}")

(defn email? [value]
  (boolean (and (string? value)
                (<= (count value) 254)
                (re-matches email-re value))))

(defn text? [value max-len]
  (boolean (and (string? value)
                (not (str/blank? value))
                (<= (count value) max-len))))

(defn optional-text? [value max-len]
  (or (nil? value) (text? value max-len)))

(defn locale [value]
  (if (contains? #{"es" "eu"} value) value "es"))

(defn booking-params-error
  "Error keyword for invalid patient booking params, nil when valid."
  [params]
  (cond
    (not (text? (:patient_name params) 120)) :invalid_patient_name
    (not (email? (:patient_email params))) :invalid_patient_email
    (not (optional-text? (:patient_phone params) 40)) :invalid_patient_phone
    (not (optional-text? (:notes params) 2000)) :invalid_notes
    (nil? (parse-instant (:starts_at params))) :invalid_starts_at))
