FROM gradle:8.4-jdk17 AS builder
WORKDIR /bidapi

COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle ./gradle
RUN chmod +x gradlew

# Warm Gradle cache
RUN ./gradlew build -x test --no-daemon || true

COPY . .
RUN ./gradlew clean build -x test --no-daemon

FROM eclipse-temurin:17-jre
WORKDIR /bidapi
COPY --from=builder /bidapi/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]