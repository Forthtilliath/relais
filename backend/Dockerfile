# --- Build : dependances en cache separe des sources pour des rebuilds rapides
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# --- Runtime : JRE seul, utilisateur non root
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S relais && adduser -S relais -G relais
COPY --from=build /app/target/*.jar app.jar
USER relais
EXPOSE 8083
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
