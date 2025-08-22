# Feature 03: Frontend Setup

> **Hinweis**: Die Code-Beispiele in dieser Spec sind framework-neutral. Siehe [00-framework-adaption-guide.md](00-framework-adaption-guide.md) für die Übersetzung in Angular, Vue oder React.

## Ziel
Moderne Frontend-Anwendung mit TypeScript einrichten und vorhandenes CSS integrieren.

## Beschreibung
Grundlegende Frontend-Infrastruktur für die TodoMVC-Anwendung erstellen. Integration des vorhandenen CSS aus `resources/css/main.css` und Einrichtung der Komponenten-Struktur.

## Akzeptanzkriterien

### Frontend Setup
- [ ] Frontend-Projekt mit TypeScript erstellt
- [ ] Routing-System konfiguriert (auch wenn initial nicht genutzt)
- [ ] CSS-Framework vorbereitet (ohne externe Dependencies)
- [ ] Development Server läuft auf Port 4200

### Komponenten-Struktur
- [ ] TodoAppComponent (Root Container)
- [ ] TodoListComponent (Todo-Liste) - Gerüst
- [ ] TodoItemComponent (Einzelnes Todo) - Gerüst
- [ ] TodoFilterComponent (Filter) - Gerüst

### CSS Integration
- [ ] Vorhandenes CSS aus `resources/css/main.css` integriert
- [ ] Global Styles konfiguriert
- [ ] TodoMVC Design erkennbar

### Proxy Konfiguration
- [ ] Angular Proxy für `/api/*` → `localhost:8080`
- [ ] Proxy-Konfiguration für Development

## Technische Spezifikationen

### Framework-spezifische Setup-Befehle

#### Angular:
```bash
ng new todo-frontend --routing --style=css
cd todo-frontend
ng generate component todo-app
ng generate component todo-list  
ng generate component todo-item
ng generate component todo-filter
```

#### Vue:
```bash
npm create vue@latest todo-frontend -- --typescript --router
cd todo-frontend
npm install
# Komponenten manuell in src/components/ erstellen
```

#### React:
```bash
npx create-react-app todo-frontend --template typescript
cd todo-frontend
npm install react-router-dom
# Komponenten manuell in src/components/ erstellen
```

### Proxy Configuration (proxy.conf.json)
```json
{
  "/api/*": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Component Hierarchy
```
TodoAppComponent
├── todo-filter (TodoFilterComponent)
├── todo-list (TodoListComponent)
│   └── todo-item (TodoItemComponent) [*ngFor]
```

### CSS Integration
- Kopiere `resources/css/main.css` nach `src/styles.css`
- TodoMVC-spezifische Klassen verfügbar
- Responsive Design basis vorhanden

## Testfälle

### Happy Flow
- [ ] `ng serve` startet ohne Fehler
- [ ] App läuft auf `http://localhost:4200`
- [ ] Alle Komponenten rendern ohne Fehler
- [ ] CSS wird korrekt geladen

### Development Setup
- [ ] Proxy zu Backend funktioniert (Test-Request an `/api/todos`)
- [ ] Hot Reload funktioniert bei Änderungen
- [ ] TypeScript Compilation ohne Warnings

### Edge Cases
- [ ] Port 4200 bereits belegt → Alternative Port
- [ ] CSS-Dateien nicht gefunden → Fallback oder Fehlermeldung

### Fehlerfälle
- [ ] Angular CLI nicht installiert → Installationsanleitung
- [ ] Node.js Version inkompatibel → Versionshinweis

## Komponenten-Gerüste

### TodoApp-Komponente (Hauptcontainer)
- Rendert die TodoMVC-Hauptstruktur
- Enthält Header mit "todos" Titel
- Integriert TodoList und TodoFilter Komponenten
- CSS-Klasse: `todoapp`

### TodoList-Komponente
- Container für alle Todo-Items
- CSS-Klasse: `main`
- Wird später Todo-Items dynamisch rendern

### TodoItem-Komponente
- Repräsentiert ein einzelnes Todo
- Wird später in TodoList verwendet

### TodoFilter-Komponente
- Filter-Navigation (All/Active/Completed)
- Wird später im Footer angezeigt

## Definition of Done
- [ ] Frontend-Anwendung läuft stabil
- [ ] Alle Basis-Komponenten erstellt
- [ ] CSS aus resources/ integriert und funktional
- [ ] Proxy zum Backend konfiguriert
- [ ] Development Workflow etabliert
- [ ] TypeScript ohne Fehler
- [ ] Basis-Template für TodoMVC sichtbar
- [ ] Framework-spezifische Best Practices befolgt

## Abhängigkeiten
- 02-todo-model.md (Backend API verfügbar)

## Nachfolgende Features
- 04-create-todo.md (Neues Todo erstellen)
- 05-display-todos.md (Todo-Liste anzeigen)