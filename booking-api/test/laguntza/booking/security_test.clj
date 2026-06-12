(ns laguntza.booking.security-test
  (:require
   [clojure.test :refer [deftest is]]
   [laguntza.booking.security :as security]))

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
