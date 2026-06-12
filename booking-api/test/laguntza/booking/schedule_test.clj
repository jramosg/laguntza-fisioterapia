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

(deftest recurring-day-window-follows-clinic-local-time
  (testing "09:00 local is 07:00Z in summer (CEST)"
    (let [{:keys [starts-at ends-at]}
          (schedule/day-window "2026-06-15" "09:00" "14:00")]
      (is (= "2026-06-15T07:00:00Z" (str starts-at)))
      (is (= "2026-06-15T12:00:00Z" (str ends-at)))))
  (testing "09:00 local is 08:00Z in winter (CET)"
    (let [{:keys [starts-at]}
          (schedule/day-window "2026-12-14" "09:00" "14:00")]
      (is (= "2026-12-14T08:00:00Z" (str starts-at))))))

(deftest weekday-is-iso-numbered
  (is (= 1 (schedule/weekday "2026-06-15")))
  (is (= 7 (schedule/weekday "2026-06-21"))))

(deftest overlapping-windows-do-not-duplicate-slots
  (let [window {:starts-at (instant "2026-06-15T08:00:00Z")
                :ends-at (instant "2026-06-15T10:00:00Z")}
        slots (schedule/available-slots
               {:date "2026-06-15"
                :service-id "session_30"
                :windows [window window]
                :busy-intervals []
                :now (instant "2026-06-14T10:00:00Z")})]
    (is (= 4 (count slots)))
    (is (apply distinct? (map :starts-at slots)))))
