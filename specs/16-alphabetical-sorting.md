# Feature 16: Alphanumerische Sortierung der Todos

## Übersicht
Implementierung einer alphanumerischen Sortierung für alle Todo-Listen im Frontend. Die Sortierung erfolgt ausschließlich client-seitig und beeinflusst nicht die Backend-Persistenz oder API-Kommunikation.

## Anforderungen

### Funktionale Anforderungen
- Todos werden alphanumerisch nach ihrem Titel sortiert
- Die Sortierung ist case-insensitive (Groß-/Kleinschreibung wird ignoriert)
- Deutsche Umlaute werden korrekt sortiert (ä→a, ö→o, ü→u, ß→ss)
- Zahlen in Titeln werden numerisch sortiert (z.B. "Todo 2" vor "Todo 10")
- Die Sortierung erfolgt nur bei der Anzeige, nicht bei der Speicherung
- Alle Filter-Ansichten (All, Active, Completed) zeigen sortierte Listen

### Technische Anforderungen
- Implementierung als separate, wiederverwendbare Methode im TodoService
- Die Methode muss für Demonstrationszwecke leicht auffindbar und modifizierbar sein
- Immutable Implementierung (Original-Arrays werden nicht verändert)
- Verwendung von `localeCompare()` für korrekte Lokalisierung

## Implementierungsdetails

### 1. Sortier-Methode

```typescript
// In todo.service.ts
private sortTodosAlphabetically(todos: Todo[]): Todo[] {
  return [...todos].sort((a, b) => 
    a.title.localeCompare(b.title, 'de-DE', { 
      numeric: true,      // "Todo 2" vor "Todo 10"
      sensitivity: 'base' // Case-insensitive
    })
  );
}
```

### 2. Integration in Observable Streams

Die Sortierung wird in folgenden Methoden integriert:

#### getCurrentlyFilteredTodos()
```typescript
getCurrentlyFilteredTodos(): Observable<Todo[]> {
  return combineLatest([this.todos$, this.currentFilterSubject]).pipe(
    map(([todos, filter]) => {
      // 1. Filterung anwenden
      const filtered = /* bestehende Filter-Logik */;
      
      // 2. Sortierung anwenden
      return this.sortTodosAlphabetically(filtered);
    })
  );
}
```

#### getFilteredTodos()
```typescript
getFilteredTodos(filter: 'all' | 'active' | 'completed'): Observable<Todo[]> {
  return this.todos$.pipe(
    map(todos => {
      // 1. Filterung anwenden
      const filtered = /* bestehende Filter-Logik */;
      
      // 2. Sortierung anwenden
      return this.sortTodosAlphabetically(filtered);
    })
  );
}
```

### 3. Warum die Persistenz funktioniert

- **ID-basierte Operationen**: Alle Backend-Calls nutzen `todo.id` zur Identifikation
- **Optimistic Updates**: ID-Mapping bleibt unverändert
- **TrackBy-Funktion**: Verwendet bereits `todo.id` für effizientes Rendering
- **Backend-Reihenfolge**: Wird nicht beeinflusst, da Sortierung nur bei Anzeige erfolgt

## Akzeptanzkriterien

### Muss-Kriterien
- [ ] Todos werden alphanumerisch nach Titel sortiert
- [ ] Sortierung ist case-insensitive
- [ ] Deutsche Umlaute werden korrekt behandelt
- [ ] Numerische Sortierung für Zahlen in Titeln
- [ ] Sortierung in allen Filter-Ansichten aktiv
- [ ] Separate, wiederverwendbare Methode implementiert

### Soll-Kriterien
- [ ] Performance bleibt auch bei 1000+ Todos akzeptabel
- [ ] Sortierung erfolgt ohne sichtbare Verzögerung
- [ ] Keine Breaking Changes in bestehender Funktionalität

## Testszenarien

### Unit Tests (TodoService)

1. **Basis-Sortierung**
   - Input: ["Zebra", "Apfel", "Mango"]
   - Erwartung: ["Apfel", "Mango", "Zebra"]

2. **Case-Insensitive**
   - Input: ["zebra", "Apfel", "MANGO"]
   - Erwartung: ["Apfel", "MANGO", "zebra"]

3. **Deutsche Umlaute**
   - Input: ["Öl", "Apfel", "Äpfel", "Übung"]
   - Erwartung: ["Apfel", "Äpfel", "Öl", "Übung"]

4. **Numerische Sortierung**
   - Input: ["Todo 10", "Todo 2", "Todo 1", "Todo 20"]
   - Erwartung: ["Todo 1", "Todo 2", "Todo 10", "Todo 20"]

5. **Gemischte Inhalte**
   - Input: ["10 Äpfel", "2 Birnen", "Übung 1", "übung 10"]
   - Erwartung: ["2 Birnen", "10 Äpfel", "Übung 1", "übung 10"]

### Integrationstests

1. **Sortierung nach Todo-Erstellung**
   - Erstelle Todos in ungeordneter Reihenfolge
   - Verifiziere alphabetische Anzeige

2. **Sortierung mit Filtern**
   - Erstelle gemischte aktive/abgeschlossene Todos
   - Verifiziere Sortierung in allen Filter-Ansichten

3. **Persistenz-Test**
   - Erstelle Todos, toggle/editiere sie
   - Verifiziere dass Operationen trotz Sortierung funktionieren

4. **Performance-Test**
   - Erstelle 100+ Todos
   - Verifiziere akzeptable Render-Zeit

## Nicht-funktionale Anforderungen

### Performance
- Sortierung soll < 100ms für 1000 Todos benötigen
- Keine merkbare UI-Verzögerung beim Wechsel zwischen Filtern

### Wartbarkeit
- Sortier-Logik als separate Methode für einfache Modifikation
- Klare Dokumentation der Sortier-Parameter
- Unit-Tests für alle Sortier-Szenarien

### Kompatibilität
- Keine Breaking Changes in bestehenden Features
- Kompatibel mit allen modernen Browsern
- Korrekte Behandlung von Unicode-Zeichen

## Ausblick / Erweiterungsmöglichkeiten

Die separate Sortier-Methode ermöglicht zukünftige Erweiterungen:
- Sortierung nach Erstellungsdatum
- Sortierung nach Completion-Status
- Benutzerdefinierte Sortier-Reihenfolge
- Sortier-Richtung umkehren (Z→A)
- Mehrkriterien-Sortierung (z.B. Status, dann alphabetisch)

## Hinweise zur Implementierung

1. **Immutability**: Immer mit `[...todos]` arbeiten, nie Original-Array mutieren
2. **Locale**: 'de-DE' für korrekte deutsche Sortierung verwenden
3. **Performance**: Bei sehr großen Listen ggf. Memoization erwägen
4. **Testing**: Separate Tests für Sortier-Methode und Integration schreiben