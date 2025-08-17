# Feature 01: Backend Setup

## Ziel
Spring Boot 3.2 Backend-Anwendung mit Java 17 und Maven einrichten.

## Beschreibung
Grundlegende Backend-Infrastruktur für die TodoMVC-Anwendung erstellen. Dies bildet das Fundament für alle nachfolgenden API-Features.

## Akzeptanzkriterien

### Muss-Kriterien
- [ ] Spring Boot 3.2 Projekt mit Maven erstellt
- [ ] Java 17 als Target-Version konfiguriert
- [ ] Spring Web Dependency eingebunden
- [ ] Spring Boot DevTools für Development eingebunden
- [ ] Anwendung startet erfolgreich auf Port 8080
- [ ] Basic Health Check Endpoint verfügbar (`/actuator/health`)

### Technische Spezifikationen
- **Framework**: Spring Boot 3.2
- **Java Version**: 17
- **Build Tool**: Maven
- **Port**: 8080
- **Dependencies**:
  - spring-boot-starter-web
  - spring-boot-starter-actuator
  - spring-boot-devtools (dev scope)

### Projekt-Struktur
```
todo-backend/
├── pom.xml
├── src/
│   └── main/
│       ├── java/
│       │   └── com/example/todobackend/
│       │       └── TodoBackendApplication.java
│       └── resources/
│           └── application.properties
```

## Testfälle

### Happy Flow
- [ ] `mvn clean install` läuft ohne Fehler durch
- [ ] `mvn spring-boot:run` startet die Anwendung
- [ ] GET `http://localhost:8080/actuator/health` gibt Status 200 zurück

### Edge Cases
- [ ] Port 8080 bereits belegt → Alternative Port oder Fehlermeldung
- [ ] Falsche Java Version → Klare Fehlermeldung

### Fehlerfälle
- [ ] Maven Dependencies nicht verfügbar → Retry-Mechanismus
- [ ] Malformed pom.xml → Validierung und Fehlermeldung

## Definition of Done
- [ ] Spring Boot Anwendung läuft stabil
- [ ] Maven Build erfolgreich
- [ ] Health Check Endpoint funktional
- [ ] Dokumentation für nächstes Feature vorbereitet
- [ ] CORS wird für localhost:4200 vorbereitet (für spätere Frontend-Integration)

## Abhängigkeiten
- Keine (erstes Feature)

## Nachfolgende Features
- 02-todo-model.md (Todo Interface und REST Endpoints)