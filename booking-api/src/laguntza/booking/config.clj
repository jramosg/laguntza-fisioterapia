(ns laguntza.booking.config
  (:import
   [java.net URI]))

(defn env [k]
  (System/getenv k))

(defn env-int [k default]
  (if-let [value (env k)]
    (parse-long value)
    default))

(defn production? []
  (= "production" (env "APP_ENV")))

(defn require-env! [k]
  (or (env k)
      (throw (ex-info (str "Missing required environment variable " k)
                      {:env k}))))

(defn public-site-url []
  (or (env "PUBLIC_SITE_URL") "http://localhost:4321"))

(defn booking-api-url []
  (or (env "BOOKING_API_URL") "http://localhost:4000"))

(defn same-origin? [origin]
  (when origin
    (= (.getHost (URI. origin))
       (.getHost (URI. (public-site-url))))))

(defn jdbc-url []
  (or (env "JDBC_URL")
      (when (production?)
        (require-env! "JDBC_URL"))))

(defn session-secret []
  (or (env "BOOKING_SESSION_SECRET")
      (when (production?)
        (require-env! "BOOKING_SESSION_SECRET"))
      "dev-only-change-me"))

(defn stripe-secret-key []
  (or (env "STRIPE_SECRET_KEY")
      (when (production?)
        (require-env! "STRIPE_SECRET_KEY"))))

(defn stripe-webhook-secret []
  (or (env "STRIPE_WEBHOOK_SECRET")
      (when (production?)
        (require-env! "STRIPE_WEBHOOK_SECRET"))))

(defn admin-email []
  (or (env "BOOKING_ADMIN_EMAIL") "info@laguntzafisioterapia.com"))

(defn admin-password-hash []
  (or (env "BOOKING_ADMIN_PASSWORD_HASH")
      (when (production?)
        (require-env! "BOOKING_ADMIN_PASSWORD_HASH"))))

(defn smtp-config []
  (when-let [host (env "SMTP_HOST")]
    {:host host
     :port (env-int "SMTP_PORT" 587)
     :user (env "SMTP_USER")
     :pass (env "SMTP_PASS")
     :from (or (env "SMTP_FROM") (admin-email))}))

(defn telegram-config []
  (when-let [token (env "TELEGRAM_BOT_TOKEN")]
    {:token token
     :chat-id (require-env! "TELEGRAM_CHAT_ID")}))
