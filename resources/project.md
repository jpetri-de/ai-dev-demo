# Überblick

Diese App soll eine einfache To-Do-App sein. Sie ist eine Nachbildung von: https://todomvc.com
Screenshots zu den einzelnen Zuständen der App befinden sich im Ordner resources/screenshots. 
Initiales CSS befindet sich in css/main.css
Analysiere zwingend die Screenshots bevor Du die claude.md erstellst und schreibe wichtige Erkenntnisse in eine markdown datei, die über die claude.md referenziert wird.


# Functionality

## Todo
Ein To-Do soll diese Eigenschaften haben:

interface Todo {
  title: string;
  completed: boolean;
}

## No todos
When there are no todos, #main and #footer should be hidden.

## New todo

New todos are entered in the input at the top of the app. The input element should be focused when the page is loaded, preferably by using the autofocus input attribute. Pressing Enter creates the todo, appends it to the todo list, and clears the input. Make sure to .trim() the input and then check that it's not empty before creating a new todo.

## Mark all as complete

This checkbox toggles all the todos to the same state as itself. Make sure to clear the checked state after the "Clear completed" button is clicked. The "Mark all as complete" checkbox should also be updated when single todo items are checked/unchecked. Eg. When all the todos are checked it should also get checked.

## Item

A todo item has three possible interactions:

- Clicking the checkbox marks the todo as complete by updating its completed value and toggling the class completed on its parent <li>

- Double-clicking the <label> activates editing mode, by toggling the .editing class on its <li>

- Hovering over the todo shows the remove button (.destroy)

## Editing

When editing mode is activated it will hide the other controls and bring forward an input that contains the todo title, which should be focused (.focus()). The edit should be saved on both blur and enter, and the editing class should be removed. Make sure to .trim() the input and then check that it's not empty. If it's empty the todo should instead be destroyed. If escape is pressed during the edit, the edit state should be left and any changes be discarded.

## Counter

Displays the number of active todos in a pluralized form. Make sure the number is wrapped by a <strong> tag. Also make sure to pluralize the item word correctly: 0 items, 1 item, 2 items. Example: 2 items left

## Clear completed button

Removes completed todos when clicked. Should be hidden when there are no completed todos.

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
  - TodoFilterComponent (All/Active/Completed Filter)
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
- **Build Tool**: Maven
- **REST Endpunkte**:
  - `GET /api/todos` - Alle Todos abrufen
  - `POST /api/todos` - Neues Todo erstellen
  - `PUT /api/todos/{id}` - Todo aktualisieren
  - `DELETE /api/todos/{id}` - Todo löschen
  - `PUT /api/todos/{id}/toggle` - Todo Status umschalten
  - `DELETE /api/todos/completed` - Alle completed Todos löschen
- **CORS**: Konfiguration für Development (localhost:4200)
- **In-Memory Storage**: List<Todo> ohne Datenbankanbindung

## Bundling
Frontend und Backend sollen als eine Anwendung gebündelt werden und gestartet werden können.

### Deployment & Development
- **Production**: Angular Build wird in Spring Boot `src/main/resources/static/` integriert
- **Development Setup**:
  - Angular Dev Server: Port 4200
  - Spring Boot: Port 8080
  - Proxy-Konfiguration für API-Calls während Development
- **Single JAR**: Finale Anwendung als ausführbare JAR-Datei
- **Hot Reload**: Separate Development Server für Frontend-Entwicklung

# UI/UX Spezifikationen (aus Screenshot-Analyse)

## Filter-Verhalten
- **All**: Zeigt alle Todos (active + completed)
- **Active**: Zeigt nur unvollständige Todos
- **Completed**: Zeigt nur abgeschlossene Todos
- Aktiver Filter wird durch Border/Hintergrund hervorgehoben

## Visual States
- **Completed Todos**: Text ist durchgestrichen (text-decoration: line-through)
- **Hover State**: Destroy-Button (×) wird bei Hover über Todo-Item sichtbar
- **Toggle-All Checkbox**: 
  - Unchecked wenn mind. 1 Todo active ist
  - Checked wenn alle Todos completed sind
  - Versteckt wenn keine Todos vorhanden

## Counter-Verhalten
- Format: `<strong>{count}</strong> item{s} left!`
- Pluralisierung: "1 item left!", "2 items left!", "0 items left!"
- Zählt nur active (nicht completed) Todos

## Clear Completed
- Button ist nur sichtbar wenn mind. 1 completed Todo existiert
- Entfernt alle completed Todos beim Click

## Input-Verhalten
- Placeholder: "What needs to be done?"
- Auto-Focus beim Laden der Seite
- Enter erstellt neues Todo, leert Input
- Input wird getrimmt, leere Todos werden nicht erstellt

## Edit-Modus
- Aktivierung: Double-Click auf Todo-Label
- Todo-Item bekommt `.editing` CSS-Klasse
- Edit-Input wird fokussiert und enthält aktuellen Todo-Text
- Speichern: Enter oder Blur
- Abbrechen: Escape (verwirft Änderungen)
- Leerer Text beim Speichern löscht das Todo

# Implementierungs-Details

## Fehlerbehandlung & Edge Cases

### Input Validation
- **HTML Escaping**: Todo-Texte müssen escaped werden gegen XSS
- **Maximale Länge**: Sinnvolle Begrenzung für Todo-Texte (z.B. 500 Zeichen)
- **Whitespace**: .trim() vor Validierung, keine reinen Leerzeichen-Todos
- **Leere Strings**: Werden abgelehnt und nicht erstellt

### Network & API
- **Loading States**: Spinner/Disabled States während API-Calls
- **Retry Mechanism**: Bei Netzwerkfehlern automatisch wiederholen
- **Offline Handling**: Graceful Degradation wenn API nicht erreichbar
- **Error Messages**: Benutzerfreundliche Fehlermeldungen

### UI Responsiveness
- **Keyboard Navigation**: Tab-Reihenfolge, Enter/Escape handling
- **Accessibility**: ARIA-Labels, Screen Reader Support
- **Touch Support**: Mobile-friendly Touch Targets
- **Performance**: Efficient Change Detection bei vielen Todos

### Data Consistency
- **Optimistic Updates**: UI sofort aktualisieren, bei Fehler zurückrollen
- **Race Conditions**: Schutz vor gleichzeitigen API-Aufrufen
- **State Management**: Konsistente Todo-Liste zwischen Komponenten
- **Memory Leaks**: Proper Cleanup von Subscriptions

## Technische Constraints
- **Browser Support**: Modern Browsers (ES2020+)
- **Mobile Responsive**: Funktioniert auf Smartphone/Tablet
- **Performance**: Smooth UI auch bei 1000+ Todos
- **Security**: CORS, Input Sanitization, kein XSS
