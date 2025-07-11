# 🎮 WifeyWeek Phase 3: Todo Editing, Templates & Intelligence

---

## 🔠 Before Phase 3 Start: Felder auslagern

### 🧹 Schritte für Cursor (Todo-Auslagerung)

1. `TitleField.tsx` erstellen

   * Props: `value`, `onChange`, `error`, `disabled`
   * Styling exakt wie aktuelles Inputfeld in `CreateTodoPage`
   * In `CreateTodoPage` einbauen und testen

2. `DateField.tsx` erstellen

   * Enthält `<MobileDatePicker />` mit allen Styling-Overrides
   * Props: `value`, `onChange`, `disabled`
   * In `CreateTodoPage` einbauen und testen

3. `TimeField.tsx` erstellen

   * Enthält `<MobileTimePicker />` mit Custom-Styling
   * Props: `value`, `onChange`, `disabled`
   * In `CreateTodoPage` einbauen und testen

4. `RepeatField.tsx` erstellen

   * Beinhaltet beide Dropdowns (Count + Unit) aus `@headlessui/react`
   * Props: `repeatCount`, `setRepeatCount`, `repeatUnit`, `setRepeatUnit`, `error`, `disabled`
   * In `CreateTodoPage` einbauen und testen

> Alle Felder müssen identisches Verhalten und Styling wie bisher aufweisen

**Bevor Phase 3 offiziell beginnt, müssen folgende Komponenten ausgelagert und in `CreateTodoPage` verwendet werden:**

### 🌟 Ziel

Die Felder für Datum, Uhrzeit und Wiederholung (repeat) sollen in wiederverwendbare Komponenten ausgelagert werden. So können sie sowohl in der `CreateTodoPage` als auch später in der `EditTodoPage` verwendet werden – ohne Style-Duplikate und Copy-Paste.

### 📆 Auszulagernde Komponenten

1. `TitleField.tsx` – für das erste Eingabefeld (Titel)
2. `DateField.tsx` – für `<MobileDatePicker />`
3. `TimeField.tsx` – für `<MobileTimePicker />`
4. `RepeatField.tsx` – für die zwei Dropdowns (Count + Unit)

### 🧠 Vorteile

* Weniger Duplicate Code
* Konsistentes Styling zwischen "Hinzufügen" und "Bearbeiten"
* Bessere Wartbarkeit

### ✅ Definition of Done

Alle vier Komponenten (`TitleField`, `DateField`, `TimeField`, `RepeatField`) sind erstellt, in `CreateTodoPage` eingebaut und funktionieren exakt wie bisher – ohne Duplikate, mit sauberen Props (`value`, `onChange`, etc.) und identischem Styling & Verhalten.

---

## ✅ Erst wenn alle Komponenten erfolgreich ausgelagert und integriert sind,

und ich getestet habe, ob alles so funktioniert und aussieht wie davor,
beginnt Phase 3.

---

# 🎮 WifeyWeek **Phase 3 – Todo Editing, Templates & Intelligence**

> *Build on Phases 1 & 2: instant TanStack Query UI ↔ Supabase Realtime ↔ Virtual Recurring System.*

---

## 🚦 Voraussetzungen (erfüllt)

| Phase | Kern-Features                                                                                                                                   | ✅ Status         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| **1** | TanStack Query Setup · Optimistic Updates · Realtime Sync                                                                                       | ✔️ abgeschlossen |
| **2** | **Virtual Recurring System** (client-seitig, keine DB-Klone) · Smart Toggle/Delete · Performance Optimierungen · **Bugfix „Immediate Display“** | ✔️ abgeschlossen |
| **3** | **Edit-Funktionalität für Todos (fokussiert auf Schritt 3-1)**                                                                                  | ➡️ *jetzt*       |

---

## 🿬️ Roadmap Phase 3 (High-Level)

|  Schritt | Ziel                    | Hauptergebnis                                                      | Akzeptanzkriterien                                                                                                                                |
| -------- | ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3-1**  | **EditTodoPage**        | Ein eigenes Formular zum Bearbeiten eines Todos (Route /edit/\:id) | ‑ Felder vorausgefüllt · Buttons X/✓ identisch zur Create-Page · Speichern nur bei Änderungen · Mutation wählt Tabelle abhängig von recurring\_id |
| **3-2**  | **Recurring Edit-Modi** | Unterstützt „Dieses Vorkommen“, „Ab hier“, „Gesamte Serie“         | ‑ Auswahl-Modal · Smart Materialize/Update recurring rule · Alle betroffenen Virtual Todos aktualisieren                                          |

## 🔄 **Schritt 3-1 – EditTodoPage** (detailliert für Cursor)

### 📂 Dateien & Strukturen

| Neu/Ändern | Datei                       | Zweck                                     |
| ---------- | --------------------------- | ----------------------------------------- |
| **➕**      | src/pages/EditTodoPage.tsx  | Hauptseite zum Bearbeiten                 |
| **➕**      | src/hooks/useTodoEdit.ts    | Gemeinsame Mutations- & Dirty-State-Logik |
| **✏️**     | src/routes.tsx oder App.tsx | Route /edit/\:id registrieren             |

### 🔧 Aufgaben-Checklist

1. **Route anlegen** → react-router-dom \<Route path="/edit/\:id" element={<EditTodoPage/>} />
2. **Todo laden** → const { data: todo } = useQuery(\["todo", id])
3. **Komponenten reuse** → TitleField, DateField, TimeField, RepeatField (controlled via local state)
4. **Dirty Check** → Button ✓ aktiv, wenn isDirty === true
5. **Mutation-Hook** →

```ts
if (todo.recurring_id) {
  updateRecurringRule.mutate(...)
} else {
  updateTodo.mutate(...)
}
```

6. **Query Invalidation** → queryClient.invalidateQueries(\["todos", year, month]) + ggf. recurring-rules
7. **Navigation** → navigate(-1) bei X oder nach Success
8. **Edge-Cases** →

   * Recurring todo, dessen Startdatum > heute 🔄 Virtual Update
   * User löscht alle Werte → Validation

### ✅ Definition of Done (Schritt 3-1)

* Alle obigen Punkte wurden von Cursor implementiert
* Test und visuelle Kontrolle übernehme **ich selbst** (nicht Cursor)
* UI/UX konsistent zur Create-Page
* Keine Regressions laut Cypress Smoke-Suite
* Roadmap-Markdown → Schritt 3-1 als **✅** markiert

> Nach Abnahme von Schritt 3-1 dokumentieren wir 3-2 und starten die nächsten Cursor-Prompts.
