# Stage 1: Build
# We use the standard JDK 21 image which supports all platforms (Mac M1/M2, Linux, Windows)
FROM gradle:8.5-jdk21 AS builder
WORKDIR /bidapi

# 1. Copy configuration first to cache dependencies
COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle ./gradle

# 2. Grant permissions
RUN chmod +x gradlew

# 3. Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# 4. Copy source and build
COPY src ./src
# build -x test skips tests to save time during Docker build
RUN ./gradlew bootJar -x test --no-daemon

# Stage 2: Runtime
# We KEEP Alpine here to ensure the final production image is small (~100MB)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /bidapi

# Add non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the JAR from the builder stage
COPY --from=builder /bidapi/build/libs/*-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]