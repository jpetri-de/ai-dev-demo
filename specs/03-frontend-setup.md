# Feature 03: Frontend Setup

## Ziel
Angular 17 Frontend-Anwendung mit TypeScript einrichten und vorhandenes CSS integrieren.

## Beschreibung
Grundlegende Angular-Infrastruktur für die TodoMVC-Anwendung erstellen. Integration des vorhandenen CSS aus `resources/css/main.css` und Einrichtung der Komponenten-Struktur.

## Akzeptanzkriterien

### Angular Setup
- [ ] Angular 17 Projekt mit TypeScript erstellt
- [ ] Routing konfiguriert (auch wenn initial nicht genutzt)
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

### Angular CLI Setup
```bash
ng new todo-frontend --routing --style=css
cd todo-frontend
ng generate component todo-app
ng generate component todo-list  
ng generate component todo-item
ng generate component todo-filter
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

### TodoAppComponent
```typescript
@Component({
  selector: 'app-todo',
  template: `
    <section class="todoapp">
      <header class="header">
        <h1>todos</h1>
        <!-- Input wird in Feature 04 implementiert -->
      </header>
      <app-todo-list></app-todo-list>
      <app-todo-filter></app-todo-filter>
    </section>
  `
})
export class TodoAppComponent { }
```

### TodoListComponent
```typescript
@Component({
  selector: 'app-todo-list',
  template: `
    <section class="main">
      <!-- Todo Items werden hier gerendert -->
    </section>
  `
})
export class TodoListComponent { }
```

## Definition of Done
- [ ] Angular 17 Anwendung läuft stabil
- [ ] Alle Basis-Komponenten erstellt
- [ ] CSS aus resources/ integriert und funktional
- [ ] Proxy zum Backend konfiguriert
- [ ] Development Workflow etabliert
- [ ] TypeScript ohne Fehler
- [ ] Basis-Template für TodoMVC sichtbar

## Abhängigkeiten
- 02-todo-model.md (Backend API verfügbar)

## Nachfolgende Features
- 04-create-todo.md (Neues Todo erstellen)
- 05-display-todos.md (Todo-Liste anzeigen)