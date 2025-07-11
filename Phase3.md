# 🎮 WifeyWeek Phase 3: Todo Editing, Templates & Intelligence

---

## 🟠 Before Phase 3 Start: Felder auslagern

### 🧩 Schritte für Cursor (Todo-Auslagerung)

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

### 📦 Auszulagernde Komponenten

1. `TitleField.tsx` – für das erste Eingabefeld (Titel)
2. `DateField.tsx` – für `<MobileDatePicker />`
3. `TimeField.tsx` – für `<MobileTimePicker />`
4. `RepeatField.tsx` – für die zwei Dropdowns (Count + Unit)

### 🧠 Vorteile

* Weniger Duplicate Code
* Konsistentes Styling zwischen "Hinzufügen" und "Bearbeiten"
* Bessere Wartbarkeit

### ✅ Definition of Done

Alle vier Komponenten (`TitleField`, `DateField`, `TimeField`, `RepeatField`) sind erstellt, in `CreateTodoPage` eingebaut und funktionieren exakt wie bisher – ohne Duplikate, mit sauberen Props (`value`, `onChange`, etc.) und identischem Styling & Verhalten. und funktionieren exakt wie bisher – ohne Duplikate, mit sauberen Props (`value`, `onChange`, etc.) und identischem Styling & Verhalten.

---

## ✅ Erst wenn alle Komponenten erfolgreich ausgelagert und integriert sind,

und ich getestet habe, ob alles so funktioniert und aussieht wie davor,
beginnt Phase 3.

---

## 🕒 Phase 3 Übersicht

> (Diese Sektion wird schrittweise erweitert)

Phase 3 kümmert sich um das **Bearbeiten bestehender Todos**, das Erkennen und Updaten von **Recurring Todos** und intelligente Vorschläge.

### 🔄 Ziel Schritt 1:

* Klick auf ein Todo → navigiert zu `/edit/:id`
* Bestehende Daten werden vorausgefüllt (inkl. Wiederholungsinfo bei `recurring_id`)
* Felder wie bei "Hinzufügen", aber **Edit-Modus**
