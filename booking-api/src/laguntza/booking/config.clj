(ns laguntza.booking.config
  (:import
   [java.net URI]))

(defn env [k]
  (or (System/getenv k) (System/getProperty k)))

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

(defn- origin-parts [url]
  (let [uri (URI. url)]
    [(.getScheme uri) (.getHost uri) (.getPort uri)]))

(defn same-origin? [origin]
  (when origin
    (try
      (= (origin-parts origin) (origin-parts (public-site-url)))
      (catch Exception _ false))))

(defn jdbc-url []
  (or (env "JDBC_URL")
      (when (production?)
        (require-env! "JDBC_URL"))))

(defonce ^:private boot-secret
  (delay (str (random-uuid) (random-uuid))))

(defn session-secret []
  (or (env "BOOKING_SESSION_SECRET")
      (when (production?)
        (require-env! "BOOKING_SESSION_SECRET"))
      ;; Random per-boot fallback: an unconfigured deployment must never
      ;; run with a guessable signing secret.
      @boot-secret))

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
