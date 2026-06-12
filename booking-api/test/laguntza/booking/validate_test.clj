(ns laguntza.booking.validate-test
  (:require
   [clojure.string :as str]
   [clojure.test :refer [deftest is]]
   [laguntza.booking.validate :as validate]))

(deftest email-validation
  (is (validate/email? "ane@example.com"))
  (is (not (validate/email? "not-an-email")))
  (is (not (validate/email? "a@b")))
  (is (not (validate/email? nil)))
  (is (not (validate/email? (str (apply str (repeat 300 "a"))
                                 "@example.com")))))

(deftest instant-and-date-parsing
  (is (some? (validate/parse-instant "2026-06-15T10:00:00Z")))
  (is (nil? (validate/parse-instant "2026-06-15")))
  (is (nil? (validate/parse-instant nil)))
  (is (some? (validate/parse-date "2026-06-15")))
  (is (nil? (validate/parse-date "15/06/2026"))))

(deftest locale-normalisation
  (is (= "eu" (validate/locale "eu")))
  (is (= "es" (validate/locale "fr")))
  (is (= "es" (validate/locale nil))))

(deftest booking-params-validation
  (let [valid {:patient_name "Ane"
               :patient_email "ane@example.com"
               :patient_phone "600111222"
               :starts_at "2026-06-15T10:00:00Z"}]
    (is (nil? (validate/booking-params-error valid)))
    (is (= :invalid_patient_name
           (validate/booking-params-error (dissoc valid :patient_name))))
    (is (= :invalid_patient_name
           (validate/booking-params-error
            (assoc valid :patient_name (str/join (repeat 200 "a"))))))
    (is (= :invalid_patient_email
           (validate/booking-params-error
            (assoc valid :patient_email "nope"))))
    (is (= :invalid_starts_at
           (validate/booking-params-error
            (assoc valid :starts_at "mañana"))))
    (is (= :invalid_notes
           (validate/booking-params-error
            (assoc valid :notes (str/join (repeat 3000 "a"))))))))
