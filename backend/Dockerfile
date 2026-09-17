# Multi-stage build: compile with the JDK, run on a slim JRE so the final image doesn't
# carry the whole Maven/JDK toolchain around.

FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

# Copy the wrapper and pom first so dependency resolution is cached across builds unless
# pom.xml actually changes (this layer is the slow one).
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline

COPY src src
RUN ./mvnw -q clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render (and most PaaS hosts) injects PORT and expects the app to bind to it -
# server.port=${PORT:8080} in application.properties already reads this.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
