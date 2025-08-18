# Code-Snippets für continue.dev Tutorial

Diese Sammlung enthält wiederverwendbare Code-Beispiele und Prompt-Templates aus dem TodoMVC-Projekt.

## 📁 Verzeichnisstruktur

```
code-snippets/
├── backend/               # Spring Boot Code-Beispiele
│   ├── controllers/       # REST Controller Templates
│   ├── services/          # Service Layer Patterns
│   ├── entities/          # JPA Entity Examples
│   ├── tests/            # Test Templates
│   └── config/           # Configuration Classes
├── frontend/             # Angular Code-Beispiele  
│   ├── components/       # Component Templates
│   ├── services/         # Service Patterns
│   ├── templates/        # HTML Template Examples
│   ├── tests/           # Test Templates
│   └── styles/          # CSS/SCSS Examples
└── prompts/             # Continue.dev Prompt Templates
    ├── chat/            # Chat-Modus Prompts
    ├── edit/            # Edit-Modus Prompts
    └── autocomplete/    # Autocomplete Konfigurationen
```

## 🚀 Quick Start

### **Backend-Entwicklung**
```bash
# 1. Entity generieren
cat code-snippets/prompts/chat/create-entity.md

# 2. Controller implementieren  
cat code-snippets/prompts/chat/create-controller.md

# 3. Tests hinzufügen
cat code-snippets/prompts/chat/create-tests.md
```

### **Frontend-Entwicklung**
```bash
# 1. Service erstellen
cat code-snippets/prompts/chat/create-angular-service.md

# 2. Component implementieren
cat code-snippets/prompts/chat/create-component.md

# 3. Template optimieren
cat code-snippets/prompts/edit/improve-template.md
```

## 📋 Verfügbare Templates

### **Chat-Modus Prompts**
- `create-entity.md` - JPA Entity mit Validation
- `create-controller.md` - REST Controller mit CRUD
- `create-service.md` - Business Logic Service
- `create-angular-service.md` - Angular HTTP Service
- `create-component.md` - Angular Standalone Component
- `debug-cors.md` - CORS-Problem Debugging
- `create-tests.md` - Unit & Integration Tests

### **Edit-Modus Prompts**
- `add-javadoc.md` - Dokumentation hinzufügen
- `improve-accessibility.md` - ARIA-Support verbessern
- `add-validation.md` - Input-Validation erweitern
- `optimize-performance.md` - Performance-Optimierungen
- `add-error-handling.md` - Error-Handling verbessern

### **Code-Beispiele**
- Vollständige Controller-Implementierungen
- Service-Pattern mit State Management
- Test-Suites mit hoher Coverage
- Accessibility-optimierte Templates
- Performance-optimierte Components

## 🎯 Verwendung

### **1. Prompt-Templates nutzen**
```bash
# Template kopieren und anpassen
cp code-snippets/prompts/chat/create-controller.md my-prompt.md
# Projekt-spezifische Anpassungen vornehmen
```

### **2. Code-Beispiele als Referenz**
```typescript
// Referenz-Implementation ansehen
cat code-snippets/backend/controllers/TodoController.java
// Als Basis für eigene Implementierung verwenden
```

### **3. Best-Practice Patterns**
```bash
# Pattern für Service-Tests
cat code-snippets/backend/tests/ServiceTestPattern.java
# In continue.dev Chat als Kontext verwenden
```

## 🔧 Integration in IDE

### **VS Code Snippets**
```json
// .vscode/snippets.json
{
  "Continue Chat Prompt": {
    "prefix": "continue-chat",
    "body": [
      "// Kontext: ${1:description}",
      "// Template: code-snippets/prompts/chat/${2:template}.md",
      "",
      "${3:prompt}"
    ]
  }
}
```

### **Custom Slash Commands**
```bash
# ~/.continue/prompts/todo-controller.prompt
Du bist ein Spring Boot Experte. Generiere einen vollständigen REST Controller
basierend auf dem TodoMVC-Pattern. Verwende die Best Practices aus:
{{file:code-snippets/backend/controllers/TodoController.java}}

Implementiere für die Entity {{highlighted_code}}:
- CRUD Endpoints (GET, POST, PUT, DELETE)
- Proper HTTP Status Codes
- Exception Handling
- Validation Support
```

## 📚 Lern-Pfade

### **Anfänger**
1. Basis-Templates nutzen (`create-entity.md`, `create-controller.md`)
2. Generated Code verstehen und anpassen
3. Einfache Edit-Prompts ausprobieren

### **Fortgeschritten**
1. Custom Prompts basierend auf Templates erstellen
2. Code-Beispiele als Kontext in komplexen Prompts nutzen
3. Multi-step Workflows mit verschiedenen Modi

### **Experte**
1. Eigene Prompt-Templates für Team entwickeln
2. Code-Snippets als Basis für Custom Slash Commands
3. Automation-Workflows mit continue.dev APIs

## 🤝 Beitragen

Neue Templates und Code-Beispiele sind willkommen:

1. **Template-Format befolgen**
2. **Real-World Beispiele verwenden**
3. **Best Practices dokumentieren**
4. **Testing-Aspekte berücksichtigen**

Siehe `CONTRIBUTING.md` für Details.

---

**Hinweis**: Alle Code-Beispiele stammen aus dem produktiven TodoMVC-Projekt und sind battle-tested. Sie können direkt als Basis für eigene Implementierungen verwendet werden.