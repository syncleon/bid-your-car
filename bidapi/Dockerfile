# Step 1: Build stage
# Gradle 8.5+ is recommended for full Java 21 support
FROM gradle:8.5-jdk21 AS builder
WORKDIR /bidapi

# Copy configuration files first to leverage Docker layer caching
COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle ./gradle
RUN chmod +x gradlew

# Warm Gradle cache (downloads dependencies)
RUN ./gradlew build -x test --no-daemon || true

# Copy source and build the application
COPY . .
RUN ./gradlew clean build -x test --no-daemon

# Step 2: Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /bidapi

# Copy the built jar from the builder stage
# Using a specific name check if you have multiple jars (like plain-jars)
COPY --from=builder /bidapi/build/libs/*-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]