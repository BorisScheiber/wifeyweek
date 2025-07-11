# 🎮 WifeyWeek Phase 2: Virtual Recurring Todos

## 🧠 Ziel

Intelligentes Recurring-System ohne DB-Klone. Recurring Todos werden clientseitig generiert und nur bei Interaktion materialisiert.

## ✅ Phase 1 Achievements

- ✅ TanStack Query mit optimistic updates
- ✅ Supabase Realtime Multi-Device Sync
- ✅ Smart Query Invalidation & Performance
- ✅ **Problem:** Recurring Todos werden als Klone in DB gespeichert

## 🚨 Aktuelle Probleme mit Klonen

- ❌ Edit eines recurring Todo → nur der Klon wird geändert
- ❌ Delete eines recurring Todo → nur der Klon wird gelöscht
- ❌ Kein "Ab hier ändern" Feature möglich
- ❌ Performance bei vielen recurring todos (100+ Klone in DB)
- ❌ Komplexe Logic für Bulk Operations

---

## 🔸 ROADMAP - Virtual Recurring System (Kleinere Steps)

### 1. ✅ Virtual Todo Types & Basic Generation

**Dateien:** `src/types/virtualTodo.ts` (neu)

**Definition of Done:**

- [✅] `VirtualTodo` interface erstellt
- [✅] Type guards: `isVirtualTodo()`, `isRealTodo()`
- [✅] Basic utility functions für Virtual ID generation
- [✅] TypeScript types exportiert

**Akzeptanzkriterien:**

- Virtual todos haben `is_virtual: true` flag
- Virtual IDs folgen pattern: `virtual_${recurringId}_${date}`
- Type safety für alle todo operations
- Clean imports in anderen files

**Code-Referenz:**

```tsx
// types/virtualTodo.ts
export interface VirtualTodo extends Omit<Todo, "id" | "created_at"> {
  id: string; // virtual_${recurringId}_${date}
  is_virtual: true;
  recurring_id: string;
  original_title: string;
}

export type SmartTodo = Todo | VirtualTodo;

export function isVirtualTodo(todo: SmartTodo): todo is VirtualTodo {
  return "is_virtual" in todo && todo.is_virtual === true;
}
```

---

### 2. ✅ Virtual Todo Generation Engine

**Dateien:** `src/utils/virtualTodoGenerator.ts` (neu)

**Definition of Done:**

- [✅] `generateVirtualTodos()` function erstellt
- [✅] Unterstützt day/week/month patterns
- [✅] Performance: Max 90 Tage im Voraus
- [✅] Berücksichtigt start_date und repeat_count

**Akzeptanzkriterien:**

- ✅ Generiert korrekte virtual todos für date range
- ✅ Respektiert alle repeat_unit Varianten
- ✅ Performance unter 50ms für 100 recurring rules
- ✅ Pure function (keine side effects)

**Code-Referenz:**

```tsx
// utils/virtualTodoGenerator.ts
export function generateVirtualTodos(
  recurringRules: RecurringTodo[],
  startDate: string,
  endDate: string
): VirtualTodo[] {
  const virtualTodos: VirtualTodo[] = [];

  for (const rule of recurringRules) {
    const dates = calculateOccurrences(rule, startDate, endDate);
    dates.forEach((date) => {
      virtualTodos.push(createVirtualTodo(rule, date));
    });
  }

  return virtualTodos;
}
```

---

### 3. ✅ Virtual Todo Caching Hook

**Dateien:** `src/hooks/useVirtualTodos.ts` (neu)

**Definition of Done:**

- [✅] `useVirtualTodos(startDate, endDate)` hook erstellt
- [✅] Cache mit useQuery implementiert
- [✅] Dependency auf recurring_rules
- [✅] Memoization für Performance

**Akzeptanzkriterien:**

- ✅ Virtual todos werden gecacht
- ✅ Cache invalidiert bei recurring rule changes
- ✅ Loading states funktionieren
- ✅ Stale time: 10 Minuten

**Code-Referenz:**

```tsx
// hooks/useVirtualTodos.ts
export function useVirtualTodos(startDate: string, endDate: string) {
  const { data: recurringRules = [] } = useQuery(["recurring-rules"]);

  return useQuery({
    queryKey: ["virtual-todos", startDate, endDate],
    queryFn: () => generateVirtualTodos(recurringRules, startDate, endDate),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: recurringRules.length > 0,
  });
}
```

---

### 4. ✅ Basic Smart Todo Merger

**Dateien:** `src/hooks/useSmartTodos.ts` (neu)

**Definition of Done:**

- [✅] `useSmartTodos(year, month)` hook erstellt
- [✅] Merged real + virtual todos
- [✅] Real todos überschreiben virtual todos
- [✅] Sortierung nach Zeit

**Akzeptanzkriterien:**

- ✅ Real todo mit recurring_id versteckt virtual todo
- ✅ Sortierung: Zeit → real vor virtual bei gleicher Zeit
- ✅ Memoization verhindert unnecessary re-renders
- ✅ API kompatibel mit bisherigem useQuery

**Code-Referenz:**

```tsx
// hooks/useSmartTodos.ts
export function useSmartTodos(year: number, month: number) {
  const startDate = dayjs(`${year}-${month + 1}-01`).format("YYYY-MM-DD");
  const endDate = dayjs(startDate).endOf("month").format("YYYY-MM-DD");

  const { data: realTodos = [] } = useQuery(["todos", year, month]);
  const { data: virtualTodos = [] } = useVirtualTodos(startDate, endDate);

  return useMemo(() => {
    return mergeAndSortTodos(realTodos, virtualTodos);
  }, [realTodos, virtualTodos]);
}
```

---

### 5. ✅ Smart Toggle Implementation

**Dateien:** `src/hooks/useSmartToggle.ts` (neu)

**Definition of Done:**

- [✅] `useSmartToggle()` mutation hook
- [✅] Auto-detection: virtual vs real todo
- [✅] Materialization logic für virtual todos
- [✅] Optimistic updates für beide types

**Akzeptanzkriterien:**

- ✅ Virtual todo toggle → materialisiert + speichert in DB
- ✅ Real todo toggle → normaler toggle
- ✅ Rollback funktioniert für beide Typen
- ✅ UI ist instant responsive

**Code-Referenz:**

```tsx
// hooks/useSmartToggle.ts
export function useSmartToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ todo, newStatus }: ToggleParams) => {
      if (isVirtualTodo(todo)) {
        return materializeAndToggleTodo(todo, newStatus);
      } else {
        return todoService.toggle(todo.id, todo.is_done);
      }
    },
    // ... optimistic updates
  });
}
```

---

### 6. ✅ Smart Delete Implementation

**Dateien:** `src/hooks/useSmartDelete.ts` (neu)

**Definition of Done:**

- [✅] `useSmartDelete()` mutation hook
- [✅] Virtual todo delete → nur aus cache entfernen
- [✅] Real todo delete → DB delete
- [✅] Optimistic updates

**Akzeptanzkriterien:**

- ✅ Virtual todos verschwinden sofort
- ✅ Real todos werden aus DB gelöscht
- ✅ Cache wird korrekt aktualisiert
- ✅ Rollback bei Fehlern

---

### 7. ✅ TodoPage Integration

**Dateien:** `src/pages/TodoPage.tsx`

**Definition of Done:**

- [✅] useSmartTodos() statt useQuery
- [✅] useSmartToggle() + useSmartDelete() integration
- [✅] Backwards compatibility gewährleistet
- [✅] Performance bleibt gleich oder besser

**Akzeptanzkriterien:**

- ✅ TodoPage funktioniert mit virtual + real todos
- ✅ UI bleibt unverändert für User
- ✅ Loading states funktionieren
- ✅ Realtime sync funktioniert weiterhin

---

### 8. ✅ Manual DB Cleanup

**Dateien:** SQL Kommandos (manuell)

**Definition of Done:**

- [✅] Git commit als safepoint erstellt
- [✅] Alle recurring todo clones aus DB gelöscht
- [✅] App funktioniert nur mit virtual todos
- [✅] Performance-Test durchgeführt
- [✅] **DB-Klon-Logik vollständig entfernt**

**Akzeptanzkriterien:**

- ✅ DELETE FROM todos WHERE recurring_id IS NOT NULL
- ✅ Nur recurring_rules bleiben in DB
- ✅ Virtual todos werden korrekt angezeigt
- ✅ Keine Performance-Verschlechterung
- ✅ **`generateRecurringTodosForMonth()` aus todoService entfernt**
- ✅ **`usePrefetchTodos` schreibt keine todos mehr in DB**
- ✅ **Virtual Todos nur noch clientseitig generiert**

**Manual SQL:**

```sql
-- Alle recurring clones löschen
DELETE FROM todos WHERE recurring_id IS NOT NULL;

-- Verify: Nur manuelle todos bleiben
SELECT COUNT(*) FROM todos WHERE recurring_id IS NULL;
```

**Note:** Git commits dienen als rollback safety - keine DB backups nötig.

---

### 9. ✅ Performance Optimizations

**Dateien:** `src/utils/performanceOptimizations.ts` (neu)

**Definition of Done:**

- [✅] Performance-Monitoring für <50ms Ziel implementiert
- [✅] Cache-Management gegen Memory-Leaks eingebaut
- [✅] Background-Task Scheduling für UI-Performance
- [✅] Performance-Metriken und Statistiken verfügbar

**Akzeptanzkriterien:**

- ✅ **Performance-Monitor**: Automatische Warnung bei >50ms Virtual Todo Generation
- ✅ **Cache-Management**: LRU-ähnliches System verhindert Memory-Leaks
- ✅ **Background-Scheduler**: Tasks werden UI-freundlich mit Delay ausgeführt
- ✅ **Performance-Stats**: Metriken für Monitoring und Optimization verfügbar
- ✅ **Utility-Functions**: Wiederverwendbare Performance-Tools für alle Hooks

---

## 🎯 Cursor Instructions für Phase 2

**Nach jedem abgeschlossenen Schritt:**

1. Implementiere mit Tests für Edge Cases ✅
2. Performance Benchmarks vor/nach ✅
3. User Experience Testing ✅
4. Update Phase2.md → Schritt als ✅ ✅

**Cursor Prompt Template:**

```
Implementiere Schritt X der WifeyWeek Phase 2 Roadmap.

CONTEXT: Virtual Recurring System ersetzt DB-Klone durch clientseitige Generation
ZIEL: [Definition of Done aus Roadmap]
EDGE CASES: [Jahr-Wechsel, Timezone, Performance bei vielen Rules]

Verwende TypeScript strict mode und teste Edge Cases.
Nach Implementierung: Update Phase2.md und markiere Schritt als ✅.
```

---

## 🌟 Expected Benefits

### 📈 **Performance:**

- **90% weniger DB entries** für recurring todos
- **Faster queries** durch kleinere todos table
- **Instant UI** durch clientseitige generation

### 🎨 **User Experience:**

- **"Edit all future"** workflows
- **"Delete from here"** functionality
- **Undo for bulk operations**
- **Smart conflict resolution**

### 🔧 **Developer Experience:**

- **Cleaner data model** ohne redundante klone
- **Easier maintenance** von recurring logic
- **Better testing** durch pure functions
- **Scalable architecture** für komplexe rules

---

---

## 🐛 CRITICAL BUGFIX: Recurring Todo Immediate Display Issue

### 📋 Problem Description

**Issue:** Nach erfolgreichem `addRecurringTodo` wurde das neue recurring todo nicht sofort in der UI angezeigt, sondern erst nach einem Reload. Das betraf nur neue recurring rules, deren erstes Vorkommen heute wäre.

**Symptoms:**

- ✅ Normale (nicht-wiederkehrende) Todos erscheinen sofort
- ❌ Recurring Todos erscheinen erst nach Browser-Reload
- ❌ Zukünftige Monate zeigten das recurring todo nicht an

### 🔍 Root Cause Analysis

**Primary Issues Identified:**

1. **Query Invalidation Race-Condition**

   - `["recurring-rules"]` wurde invalidiert, aber Virtual Todo Queries liefen vor vollständigem Reload
   - `useVirtualTodos` hat `enabled: !isLoadingRules` → während Load sind Virtual Queries disabled

2. **Internal Cache Problem**

   - `virtualTodoGenerator.ts` hatte eigenen internen Cache (`virtualTodoCache`)
   - React Query Caches wurden geleert, aber interner Cache blieb bestehen
   - Resultat: `"⚡ Cache Hit: 8 Virtual Todos aus Cache geladen"` mit alten Daten

3. **calculateAffectedMonths Logic Error**

   - `maxIterations = Math.min(repeatCount, 24)` war falsch
   - Bei "1x im Monat" → `repeatCount = 1` → nur 1 Iteration → nur aktueller Monat
   - Sollte sein: `Math.ceil(24 / repeatCount)` für Zeitraum-basierte Berechnung

4. **Missing Today-Check Fallback**
   - Wenn `calculateAffectedMonths()` den aktuellen Monat übersprang
   - Kein expliziter Fallback für "heute startende" recurring todos

### 🛠️ Implemented Fixes

**Fix 1: Hook Upgrade (`TodoPage.tsx`)**

```typescript
// Vorher: Grundlegende Version
import { useSmartTodos } from "../hooks/useSmartTodos";

// Nachher: Optimierte Version mit besserer Cache-Invalidierung
import { useSmartTodosOptimized as useSmartTodos } from "../hooks/useSmartTodosOptimized";
```

**Fix 2: Internal Cache Clearing (`useTodoMutations.ts`)**

```typescript
// Import hinzugefügt
import { clearVirtualTodoCache } from "../utils/virtualTodoGenerator";

// Im addRecurringTodoMutation:
// 0. ⚡ CRITICAL: Leere den internen Virtual Todo Cache
console.log("🧹 Recurring Todo: Leere internen Virtual Todo Cache");
clearVirtualTodoCache();
```

**Fix 3: Race-Condition Lösung**

```typescript
// Vorher: Nur invalidate + setTimeout
await queryClient.invalidateQueries({ queryKey: ["recurring-rules"] });

// Nachher: Explizite fetchQuery mit await
const newRules = await queryClient.fetchQuery({
  queryKey: ["recurring-rules"],
  queryFn: () => todoService.getAllRecurringTodos(),
  staleTime: 0, // Force fresh fetch
});
```

**Fix 4: calculateAffectedMonths Korrektur**

```typescript
// Vorher (falsch):
maxIterations = Math.min(repeatCount, 24); // repeatCount=1 → nur 1 Iteration

// Nachher (richtig):
maxIterations = Math.ceil(24 / repeatCount); // 24/1 = 24 Monate Vorschau
```

**Fix 5: Today-Check Fallback**

```typescript
// Expliziter Check für heute startende recurring todos
const today = dayjs();
const startDate = dayjs(data.start_date);

if (startDate.isSame(today, "day")) {
  const todayQueryKey = ["todos", today.year(), today.month()];
  const isAlreadyIncluded = queryKeysToInvalidate.some(
    (key) => JSON.stringify(key) === JSON.stringify(todayQueryKey)
  );

  if (!isAlreadyIncluded) {
    queryKeysToInvalidate.push(todayQueryKey);
    console.log("🎯 HEUTE-FIX: Aktueller Monat explizit hinzugefügt");
  }
}
```

### 🎯 Final Solution Architecture

**Complete Invalidation Flow:**

1. ⚡ **Clear Internal Cache**: `clearVirtualTodoCache()`
2. 🔄 **Invalidate & Wait**: `await queryClient.invalidateQueries(["recurring-rules"])`
3. 📡 **Force Fresh Fetch**: `await queryClient.fetchQuery(["recurring-rules"])`
4. 🧹 **Clear Virtual Caches**: `queryClient.removeQueries(["virtual-todos"])`
5. 🎯 **Explicit Refetch**: alle aktiven virtual-todos Queries
6. 📅 **Smart Month Calculation**: Korrekte `calculateAffectedMonths` Logic
7. 🌅 **Today Fallback**: Expliziter Check für heute startende Todos

### ✅ Validation & Results

**Before Fix:**

- ❌ Recurring todo nur nach Reload sichtbar
- ❌ Zukünftige Monate fehlen
- ❌ `"⚡ Cache Hit"` mit veralteten Daten
- ❌ Race-Conditions bei schneller Navigation

**After Fix:**

- ✅ Recurring todo erscheint **sofort** nach Speichern
- ✅ Alle zukünftigen Monate korrekt angezeigt
- ✅ Kein Cache-Hit mit alten Daten
- ✅ Konsistente Anzeige auch bei schneller Navigation
- ✅ Funktioniert für alle Patterns: täglich, wöchentlich, monatlich

**Test Cases Verified:**

- ✅ "Heute 1x die Woche" → sofort sichtbar, nächste Woche korrekt
- ✅ "Heute 1x im Monat" → sofort sichtbar, nächster Monat korrekt
- ✅ "Morgen 1x die Woche" → ab morgen sichtbar, folgende Wochen korrekt

### 📚 Key Learnings

1. **Mehrschichtige Caches**: React Query + interne Caches müssen synchron geleert werden
2. **Race-Conditions**: Bei Async Operations explizit auf Dependencies warten
3. **Query Dependencies**: `enabled` Conditions können Invalidation verhindern
4. **Today-Edge-Cases**: Explizite Fallbacks für "heute startende" Events
5. **Logic vs Math**: `repeatCount` ist Intervall, nicht Anzahl Termine

---

## 🧪 Future Extensions (Phase 3)

- 📅 **Complex Recurrence Patterns** (every 2nd Tuesday)
- 🎨 **Todo Templates** with predefined fields
- 📊 **Analytics Dashboard** für recurring patterns
- 🔄 **Sync with External Calendars** (Google Calendar)
- 🤖 **AI-powered Todo Suggestions** based on patterns
- 👥 **Collaborative Recurring Lists** mit role-based permissions
