(ns laguntza.booking.schedule
  (:import
   [java.time Duration Instant LocalDate ZoneId ZonedDateTime]))

(def clinic-zone (ZoneId/of "Europe/Madrid"))
(def default-step-minutes 30)

(def services
  {"session_30" {:id "session_30"
                 :duration-minutes 30
                 :name-es "Sesión de fisioterapia 30 min"
                 :name-eu "Fisioterapia saioa 30 min"}
   "session_60" {:id "session_60"
                 :duration-minutes 60
                 :name-es "Sesión de fisioterapia 60 min"
                 :name-eu "Fisioterapia saioa 60 min"}})

(defn parse-date [date]
  (cond
    (instance? LocalDate date) date
    (string? date) (LocalDate/parse date)
    :else (throw (ex-info "Invalid date" {:date date}))))

(defn day-bounds [date]
  (let [local-date (parse-date date)
        starts (.atStartOfDay local-date clinic-zone)
        ends (.plusDays starts 1)]
    {:starts-at (.toInstant starts)
     :ends-at (.toInstant ends)}))

(defn minutes-between [^Instant starts-at ^Instant ends-at]
  (.toMinutes (Duration/between starts-at ends-at)))

(defn overlaps? [a-start a-end b-start b-end]
  (and (.isBefore a-start b-end)
       (.isBefore b-start a-end)))

(defn interval-overlaps? [{:keys [starts-at ends-at]} start end]
  (overlaps? starts-at ends-at start end))

(defn busy? [busy-intervals start end]
  (boolean (some #(interval-overlaps? % start end) busy-intervals)))

(defn align-up [^Instant instant step-minutes]
  (let [epoch-minute (quot (.getEpochSecond instant) 60)
        remainder (mod epoch-minute step-minutes)
        aligned (if (zero? remainder)
                  epoch-minute
                  (+ epoch-minute (- step-minutes remainder)))]
    (Instant/ofEpochSecond (* aligned 60))))

(defn slot-seq
  [{:keys [window-start window-end duration-minutes step-minutes now]}]
  (let [start (align-up (if now
                          (max-key #(.toEpochMilli ^Instant %) window-start now)
                          window-start)
                        step-minutes)
        duration (Duration/ofMinutes duration-minutes)]
    (take-while
     (fn [slot-start]
       (not (.isAfter (.plus slot-start duration) window-end)))
     (iterate #(.plus % (Duration/ofMinutes step-minutes)) start))))

(defn available-slots
  [{:keys [date service-id windows busy-intervals now step-minutes]
    :or {busy-intervals []
         step-minutes default-step-minutes}}]
  (let [{day-start :starts-at day-end :ends-at} (day-bounds date)
        duration-minutes (get-in services [service-id :duration-minutes])]
    (when-not duration-minutes
      (throw (ex-info "Unknown service" {:service-id service-id})))
    (->> windows
         (keep (fn [{:keys [starts-at ends-at]}]
                 (let [window-start (max-key #(.toEpochMilli ^Instant %)
                                             starts-at
                                             day-start)
                       window-end (min-key #(.toEpochMilli ^Instant %)
                                           ends-at
                                           day-end)]
                   (when (.isBefore window-start window-end)
                     {:window-start window-start
                      :window-end window-end}))))
         (mapcat #(slot-seq (assoc %
                                   :duration-minutes duration-minutes
                                   :step-minutes step-minutes
                                   :now now)))
         (remove (fn [slot-start]
                   (let [slot-end (.plus slot-start
                                         (Duration/ofMinutes duration-minutes))]
                     (busy? busy-intervals slot-start slot-end))))
         (map (fn [slot-start]
                {:starts-at slot-start
                 :ends-at (.plus slot-start
                                 (Duration/ofMinutes duration-minutes))}))
         vec)))

(defn cancellable? [now starts-at]
  (not (.isAfter now (.minus starts-at (Duration/ofHours 24)))))

(defn local-slot-label [^Instant instant]
  (let [zoned (ZonedDateTime/ofInstant instant clinic-zone)]
    (format "%02d:%02d" (.getHour zoned) (.getMinute zoned))))
