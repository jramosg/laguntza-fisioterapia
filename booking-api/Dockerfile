FROM clojure:temurin-21-tools-deps-bookworm

WORKDIR /app

COPY deps.edn ./
RUN clojure -P

COPY resources ./resources
COPY src ./src

EXPOSE 4000

CMD ["clojure", "-M", "-m", "laguntza.booking.core"]
