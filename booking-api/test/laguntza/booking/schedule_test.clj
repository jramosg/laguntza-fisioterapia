(ns laguntza.booking.schedule-test
  (:require
   [clojure.test :refer [deftest is testing]]
   [laguntza.booking.schedule :as schedule])
  (:import
   [java.time Instant]))

(defn instant [value]
  (Instant/parse value))

(deftest generates-30-minute-slots-inside-flexible-window
  (let [slots (schedule/available-slots
               {:date "2026-06-15"
                :service-id "session_30"
                :windows [{:starts-at (instant "2026-06-15T08:00:00Z")
                           :ends-at (instant "2026-06-15T10:00:00Z")}]
                :busy-intervals []
                :now (instant "2026-06-14T10:00:00Z")})]
    (is (= ["2026-06-15T08:00:00Z"
            "2026-06-15T08:30:00Z"
            "2026-06-15T09:00:00Z"
            "2026-06-15T09:30:00Z"]
           (mapv (comp str :starts-at) slots)))))

(deftest removes-overlapping-busy-intervals
  (testing "a 60 minute service cannot overlap a manual booking"
    (let [slots (schedule/available-slots
                 {:date "2026-06-15"
                  :service-id "session_60"
                  :windows [{:starts-at (instant "2026-06-15T08:00:00Z")
                             :ends-at (instant "2026-06-15T12:00:00Z")}]
                  :busy-intervals [{:starts-at (instant "2026-06-15T09:30:00Z")
                                    :ends-at (instant "2026-06-15T10:30:00Z")}]
                  :now (instant "2026-06-14T10:00:00Z")})]
      (is (= ["2026-06-15T08:00:00Z"
              "2026-06-15T08:30:00Z"
              "2026-06-15T10:30:00Z"
              "2026-06-15T11:00:00Z"]
             (mapv (comp str :starts-at) slots))))))

(deftest enforces-24-hour-cancellation-window
  (is (schedule/cancellable? (instant "2026-06-14T08:00:00Z")
                             (instant "2026-06-15T08:00:00Z")))
  (is (not (schedule/cancellable? (instant "2026-06-14T08:00:01Z")
                                  (instant "2026-06-15T08:00:00Z")))))
