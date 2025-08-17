# Überblick

Diese App soll eine einfache To-Do-App sein. Sie ist eine Nachbildung von: <https://todomvc.com>
Screenshots zu den einzelnen Zuständen der App befinden sich im Ordner resources/screenshots.
Initiales CSS befindet sich in css/main.css
Analysiere zwingend die Screenshots bevor Du die claude.md erstellst und schreibe wichtige Erkenntnisse in eine markdown datei, die über die claude.md referenziert wird.

# Funktionalität

## Todo

Ein To-Do soll diese Eigenschaften haben:

interface Todo {
  title: string;
  completed: boolean;
}

## Keine Todos
Wenn keine Todos vorhanden sind, sollen #main und #footer ausgeblendet werden.

## Neues Todo

Neue Todos werden über das Eingabefeld am oberen Rand der App eingegeben. Das Eingabefeld soll beim Laden der Seite fokussiert werden, vorzugsweise durch das autofocus-Attribut. Das Drücken der Enter-Taste erstellt das Todo, fügt es zur Todo-Liste hinzu und leert das Eingabefeld. Das Eingabefeld muss mit .trim() bereinigt und auf Leerheit geprüft werden, bevor ein neues Todo erstellt wird.

## Alle als erledigt markieren

Diese Checkbox schaltet alle Todos in denselben Zustand wie sich selbst um. Nach dem Klick auf "Erledigte löschen" muss der checked-Zustand zurückgesetzt werden. Die "Alle als erledigt markieren"-Checkbox soll auch aktualisiert werden, wenn einzelne Todo-Elemente an-/abgewählt werden. Wenn beispielsweise alle Todos angehakt sind, soll auch diese Checkbox angehakt werden.

## Todo-Element

Ein Todo-Element hat drei mögliche Interaktionen:

- Klick auf die Checkbox markiert das Todo als erledigt durch Aktualisierung des completed-Wertes und Umschalten der CSS-Klasse completed am übergeordneten Element

- Doppelklick auf das Label aktiviert den Bearbeitungsmodus durch Umschalten der .editing-Klasse am übergeordneten Element

- Hover über das Todo zeigt den Löschen-Button (.destroy) an

## Bearbeitung

Wenn der Bearbeitungsmodus aktiviert wird, werden die anderen Bedienelemente ausgeblendet und ein Eingabefeld mit dem Todo-Titel wird angezeigt, das fokussiert werden soll (.focus()). Die Bearbeitung soll sowohl bei blur als auch bei Enter gespeichert werden, und die editing-Klasse soll entfernt werden. Das Eingabefeld muss mit .trim() bereinigt und auf Leerheit geprüft werden. Wenn es leer ist, soll das Todo stattdessen gelöscht werden. Wenn Escape während der Bearbeitung gedrückt wird, soll der Bearbeitungszustand verlassen und alle Änderungen verworfen werden.

## Zähler

Zeigt die Anzahl der aktiven Todos in pluralisierter Form an. Die Zahl muss von einem strong-Tag umschlossen werden. Die Pluralisierung des Wortes "item" muss korrekt erfolgen: 0 items, 1 item, 2 items. Beispiel: 2 items left

## Erledigte löschen Button

Entfernt erledigte Todos beim Klick. Soll ausgeblendet werden, wenn keine erledigten Todos vorhanden sind.

## Persistence

Die Daten sollen nur im Speicher gehalten werden - es soll keine echte Persistenz geben.

# Technik

## Frontend

Das Frontend soll in Angular entwickelt werden.

### Spezifikationen

- **Angular Version**: 17 mit TypeScript
- **Komponenten-Struktur**:
  - TodoAppComponent (Haupt-Container)
  - TodoListComponent (Todo-Liste)
  - TodoItemComponent (Einzelnes Todo)
  - TodoFilterComponent (Alle/Aktive/Erledigte Filter)
- **Services**: TodoService für HTTP-Kommunikation
- **Styling**: Integration des vorhandenen CSS aus resources/css/main.css

## Backend

Das Backend soll eine Spring Boot Anwendung sein.
Das Backend soll Services für alle CRUD Funktionen besitzen.
Weitere Services sollen je nach Bedarf des Frontends bereitgestellt werden.
Die Anbindung soll per REST erfolgen.

### Spezifikationen

- **Spring Boot Version**: 3.2
- **Java Version**: 17
- **Build-Tool**: Maven
- **REST Endpunkte**:
  - `GET /api/todos` - Alle Todos abrufen
  - `POST /api/todos` - Neues Todo erstellen
  - `PUT /api/todos/{id}` - Todo aktualisieren
  - `DELETE /api/todos/{id}` - Todo löschen
  - `PUT /api/todos/{id}/toggle` - Todo Status umschalten
  - `DELETE /api/todos/completed` - Alle erledigten Todos löschen
- **CORS**: Konfiguration für Development (localhost:4200)
- **In-Memory Storage**: List ohne Datenbankanbindung

## Bundling

Frontend und Backend sollen als eine Anwendung gebündelt werden und gestartet werden können.

### Deployment & Entwicklung

- **Produktion**: Angular Build wird in Spring Boot `src/main/resources/static/` integriert
- **Entwicklungsumgebung**:
  - Angular Dev Server: Port 4200
  - Spring Boot: Port 8080
  - Proxy-Konfiguration für API-Aufrufe während der Entwicklung
- **Single JAR**: Finale Anwendung als ausführbare JAR-Datei
- **Hot Reload**: Separater Entwicklungsserver für Frontend-Entwicklung

# UI/UX Spezifikationen (aus Screenshot-Analyse)

## Filter-Verhalten

- **Alle**: Zeigt alle Todos (aktive + erledigte)
- **Aktive**: Zeigt nur unvollständige Todos
- **Erledigte**: Zeigt nur abgeschlossene Todos
- Aktiver Filter wird durch Umrandung/Hintergrund hervorgehoben

## Visuelle Zustände

- **Erledigte Todos**: Text ist durchgestrichen (text-decoration: line-through)
- **Hover-Zustand**: Löschen-Button (×) wird bei Hover über Todo-Element sichtbar
- **Alle-umschalten Checkbox**:
  - Nicht angehakt wenn mind. 1 Todo aktiv ist
  - Angehakt wenn alle Todos erledigt sind
  - Versteckt wenn keine Todos vorhanden

## Zähler-Verhalten

- Format: `<strong>{anzahl}</strong> item{s} left!`
- Pluralisierung: "1 item left!", "2 items left!", "0 items left!"
- Zählt nur aktive (nicht erledigte) Todos

## Erledigte löschen

- Button ist nur sichtbar wenn mind. 1 erledigtes Todo existiert
- Entfernt alle erledigten Todos beim Klick

## Eingabe-Verhalten

- Platzhaltertext: "What needs to be done?"
- Automatischer Fokus beim Laden der Seite
- Enter erstellt neues Todo, leert Eingabefeld
- Eingabe wird getrimmt, leere Todos werden nicht erstellt

## Bearbeitungs-Modus

- Aktivierung: Doppelklick auf Todo-Label
- Todo-Element bekommt `.editing` CSS-Klasse
- Bearbeitungs-Eingabefeld wird fokussiert und enthält aktuellen Todo-Text
- Speichern: Enter oder Blur
- Abbrechen: Escape (verwirft Änderungen)
- Leerer Text beim Speichern löscht das Todo

# Implementierungs-Details

## Fehlerbehandlung & Randfälle

### Eingabe-Validierung

- **HTML Escaping**: Todo-Texte müssen escaped werden gegen XSS
- **Maximale Länge**: Sinnvolle Begrenzung für Todo-Texte (z.B. 500 Zeichen)
- **Leerzeichen**: .trim() vor Validierung, keine reinen Leerzeichen-Todos
- **Leere Strings**: Werden abgelehnt und nicht erstellt

### Netzwerk & API

- **Ladezustände**: Spinner/Deaktivierte Zustände während API-Aufrufen
- **Wiederholungsmechanismus**: Bei Netzwerkfehlern automatisch wiederholen
- **Offline-Behandlung**: Graceful Degradation wenn API nicht erreichbar
- **Fehlermeldungen**: Benutzerfreundliche Fehlermeldungen

### Benutzeroberflächen-Reaktionsfähigkeit

- **Tastatur-Navigation**: Tab-Reihenfolge, Enter/Escape-Behandlung
- **Barrierefreiheit**: ARIA-Labels, Screenreader-Unterstützung
- **Touch-Unterstützung**: Mobile-freundliche Touch-Ziele
- **Performance**: Effiziente Änderungserkennung bei vielen Todos

### Datenkonsistenz

- **Optimistische Updates**: UI sofort aktualisieren, bei Fehler zurückrollen
- **Race Conditions**: Schutz vor gleichzeitigen API-Aufrufen
- **Zustandsverwaltung**: Konsistente Todo-Liste zwischen Komponenten
- **Speicherlecks**: Ordnungsgemäße Bereinigung von Subscriptions

## Technische Einschränkungen

- **Browser-Unterstützung**: Moderne Browser (ES2020+)
- **Mobile Responsive**: Funktioniert auf Smartphone/Tablet
- **Performance**: Flüssige Benutzeroberfläche auch bei 1000+ Todos
- **Sicherheit**: CORS, Eingabe-Bereinigung, kein XSS
