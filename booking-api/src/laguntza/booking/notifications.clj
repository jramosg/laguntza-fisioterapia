(ns laguntza.booking.notifications
  (:require
   [cheshire.core :as json]
   [laguntza.booking.config :as config]
   [laguntza.booking.repo :as repo]
   [laguntza.booking.schedule :as schedule]
   [next.jdbc :as jdbc]
   [postal.core :as postal])
  (:import
   [java.net URI URLEncoder]
   [java.net.http HttpClient HttpRequest HttpRequest$BodyPublishers
    HttpResponse$BodyHandlers]))

(defn booking-confirmed-payload [booking]
  {:booking_id (:id booking)
   :reference (:public_token booking)
   :patient_name (:patient_name booking)
   :patient_email (:patient_email booking)
   :starts_at (:starts_at booking)
   :ends_at (:ends_at booking)
   :starts_local (schedule/local-datetime-label (:starts_at booking))
   :ends_local (schedule/local-slot-label (:ends_at booking))
   :terms "Cancelaciones y cambios hasta 24 horas antes de la cita."})

(defn enqueue-booking-confirmed! [tx booking]
  (let [payload (booking-confirmed-payload booking)]
    (repo/enqueue-notification! tx booking "email" "booking_confirmed" payload)
    (repo/enqueue-notification! tx
                                booking
                                "telegram"
                                "booking_confirmed"
                                payload)))

(defn- send-email! [payload]
  (let [{:keys [host port user pass from]} (config/smtp-config)]
    (when-not host
      (throw (ex-info "SMTP is not configured" {:channel "email"})))
    (postal/send-message
     {:host host :port port :user user :pass pass :tls true}
     {:from from
      :to (:patient_email payload)
      :subject "Confirmacion de cita - Laguntza Fisioterapia"
      :body [{:type "text/plain; charset=utf-8"
              :content (str "Hola " (:patient_name payload) ",\n\n"
                            "Tu cita queda confirmada:\n"
                            (:starts_local payload)
                            " - " (:ends_local payload) "\n\n"
                            "Referencia: " (:reference payload) "\n\n"
                            (:terms payload) "\n\n"
                            "Laguntza Fisioterapia")}]})))

(defn- send-telegram! [payload]
  (let [{:keys [token chat-id]} (config/telegram-config)]
    (when-not token
      (throw (ex-info "Telegram is not configured" {:channel "telegram"})))
    (let [text (str "Nueva cita confirmada\n"
                    (:patient_name payload) "\n"
                    (:starts_local payload) " - " (:ends_local payload))
          body (str "chat_id=" (URLEncoder/encode chat-id "UTF-8")
                    "&text=" (URLEncoder/encode text "UTF-8"))
          request (-> (HttpRequest/newBuilder)
                      (.uri (URI/create
                             (str "https://api.telegram.org/bot" token
                                  "/sendMessage")))
                      (.header "Content-Type"
                               "application/x-www-form-urlencoded")
                      (.POST (HttpRequest$BodyPublishers/ofString body))
                      (.build))
          response (.send (HttpClient/newHttpClient)
                          request
                          (HttpResponse$BodyHandlers/ofString))]
      (when (>= (.statusCode response) 300)
        (throw (ex-info "Telegram notification failed"
                        {:status (.statusCode response)}))))))

(defn deliver! [notification]
  (let [payload (json/parse-string (str (:payload notification)) true)]
    (case (:channel notification)
      "email" (send-email! payload)
      "telegram" (send-telegram! payload))))

(defn deliver-pending! [ds]
  (let [pending (repo/pending-notifications ds 25)]
    (doseq [notification pending]
      (try
        (deliver! notification)
        (jdbc/with-transaction [tx ds]
          (repo/mark-notification-sent! tx (:id notification)))
        (catch Exception e
          (jdbc/with-transaction [tx ds]
            (repo/mark-notification-failed! tx
                                            (:id notification)
                                            (ex-message e))))))
    {:processed (count pending)}))
