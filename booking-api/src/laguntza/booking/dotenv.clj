(ns laguntza.booking.dotenv
  (:require
   [clojure.java.io :as io]
   [clojure.string :as str]))

(defn- strip-quotes [v]
  (let [v (str/trim v)]
    (if (and (>= (count v) 2)
             (or (and (str/starts-with? v "\"") (str/ends-with? v "\""))
                 (and (str/starts-with? v "'") (str/ends-with? v "'"))))
      (subs v 1 (dec (count v)))
      v)))

(defn- parse-line [line]
  (let [line (str/trim line)
        line (cond-> line
               (str/starts-with? line "export ") (subs 7))]
    (when (and (seq line) (not (str/starts-with? line "#")))
      (let [[k v] (str/split line #"=" 2)
            k     (some-> k str/trim not-empty)]
        (when k [k (strip-quotes (or v ""))])))))

(defn load!
  ([] (load! ".env"))
  ([path]
   (let [f (io/file path)]
     (when (.isFile f)
       (with-open [r (io/reader f)]
         (doseq [[k v] (keep parse-line (line-seq r))
                 :when (nil? (System/getenv k))]
           (System/setProperty k v)))))))
