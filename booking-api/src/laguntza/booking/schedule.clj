(ns laguntza.booking.schedule
  (:import
   [java.time Duration Instant LocalDate LocalTime ZoneId
    ZonedDateTime]))

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

(defn ->instant
  "Coerce JDBC timestamps, ISO strings, and Instants to Instant."
  [value]
  (cond
    (instance? Instant value) value
    (instance? java.util.Date value) (.toInstant ^java.util.Date value)
    (string? value) (Instant/parse value)
    :else (throw (ex-info "Invalid instant" {:value value}))))

(defn instant->local-date [instant]
  (LocalDate/ofInstant (->instant instant) clinic-zone))

(defn ->local-time
  "Coerce JDBC times, HH:mm strings, and LocalTimes to LocalTime."
  [value]
  (cond
    (instance? LocalTime value) value
    (instance? java.sql.Time value) (.toLocalTime ^java.sql.Time value)
    (string? value) (LocalTime/parse value)
    :else (throw (ex-info "Invalid time" {:value value}))))

(defn weekday
  "ISO day of week for a date: 1 = Monday .. 7 = Sunday."
  [date]
  (.getValue (.getDayOfWeek (parse-date date))))

(defn day-window
  "Materialise start/end times of day on a concrete date into an
  interval, in clinic local time (so DST never shifts opening hours)."
  [date start-time end-time]
  (let [local-date (parse-date date)]
    {:starts-at (.toInstant (ZonedDateTime/of local-date
                                              (->local-time start-time)
                                              clinic-zone))
     :ends-at (.toInstant (ZonedDateTime/of local-date
                                            (->local-time end-time)
                                            clinic-zone))}))

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
  [{:keys [date service-id duration-minutes windows busy-intervals now
           step-minutes]
    :or {busy-intervals []
         step-minutes default-step-minutes}}]
  (let [{day-start :starts-at day-end :ends-at} (day-bounds date)
        duration-minutes (or duration-minutes
                             (get-in services
                                     [service-id :duration-minutes]))]
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
         ;; Recurring and one-off windows may overlap on the same day.
         distinct
         (remove (fn [slot-start]
                   (let [slot-end (.plus slot-start
                                         (Duration/ofMinutes duration-minutes))]
                     (busy? busy-intervals slot-start slot-end))))
         (map (fn [slot-start]
                {:starts-at slot-start
                 :ends-at (.plus slot-start
                                 (Duration/ofMinutes duration-minutes))}))
         vec)))

(defn cancellable? [^Instant now starts-at]
  (let [starts-at (->instant starts-at)]
    (not (.isAfter now (.minus starts-at (Duration/ofHours 24))))))

(defn local-slot-label [instant]
  (let [zoned (ZonedDateTime/ofInstant (->instant instant) clinic-zone)]
    (format "%02d:%02d" (.getHour zoned) (.getMinute zoned))))

(defn local-datetime-label [instant]
  (let [zoned (ZonedDateTime/ofInstant (->instant instant) clinic-zone)]
    (format "%02d/%02d/%d %02d:%02d"
            (.getDayOfMonth zoned)
            (.getMonthValue zoned)
            (.getYear zoned)
            (.getHour zoned)
            (.getMinute zoned))))
