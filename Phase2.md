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

### 1. 📋 Virtual Todo Types & Basic Generation
**Dateien:** `src/types/virtualTodo.ts` (neu)

**Definition of Done:**
- [ ] `VirtualTodo` interface erstellt
- [ ] Type guards: `isVirtualTodo()`, `isRealTodo()`
- [ ] Basic utility functions für Virtual ID generation
- [ ] TypeScript types exportiert

**Akzeptanzkriterien:**
- Virtual todos haben `is_virtual: true` flag
- Virtual IDs folgen pattern: `virtual_${recurringId}_${date}`
- Type safety für alle todo operations
- Clean imports in anderen files

**Code-Referenz:**
```tsx
// types/virtualTodo.ts
export interface VirtualTodo extends Omit<Todo, 'id' | 'created_at'> {
  id: string // virtual_${recurringId}_${date}
  is_virtual: true
  recurring_id: string
  original_title: string
}

export type SmartTodo = Todo | VirtualTodo

export function isVirtualTodo(todo: SmartTodo): todo is VirtualTodo {
  return 'is_virtual' in todo && todo.is_virtual === true
}
```

---

### 2. 🧙‍♂️ Virtual Todo Generation Engine
**Dateien:** `src/utils/virtualTodoGenerator.ts` (neu)

**Definition of Done:**
- [ ] `generateVirtualTodos()` function erstellt
- [ ] Unterstützt day/week/month patterns
- [ ] Performance: Max 90 Tage im Voraus
- [ ] Berücksichtigt start_date und repeat_count

**Akzeptanzkriterien:**
- Generiert korrekte virtual todos für date range
- Respektiert alle repeat_unit Varianten
- Performance unter 50ms für 100 recurring rules
- Pure function (keine side effects)

**Code-Referenz:**
```tsx
// utils/virtualTodoGenerator.ts
export function generateVirtualTodos(
  recurringRules: RecurringTodo[],
  startDate: string,
  endDate: string
): VirtualTodo[] {
  const virtualTodos: VirtualTodo[] = []
  
  for (const rule of recurringRules) {
    const dates = calculateOccurrences(rule, startDate, endDate)
    dates.forEach(date => {
      virtualTodos.push(createVirtualTodo(rule, date))
    })
  }
  
  return virtualTodos
}
```

---

### 3. 📦 Virtual Todo Caching Hook
**Dateien:** `src/hooks/useVirtualTodos.ts` (neu)

**Definition of Done:**
- [ ] `useVirtualTodos(startDate, endDate)` hook erstellt
- [ ] Cache mit useQuery implementiert
- [ ] Dependency auf recurring_rules
- [ ] Memoization für Performance

**Akzeptanzkriterien:**
- Virtual todos werden gecacht
- Cache invalidiert bei recurring rule changes
- Loading states funktionieren
- Stale time: 10 Minuten

**Code-Referenz:**
```tsx
// hooks/useVirtualTodos.ts
export function useVirtualTodos(startDate: string, endDate: string) {
  const { data: recurringRules = [] } = useQuery(['recurring-rules'])
  
  return useQuery({
    queryKey: ['virtual-todos', startDate, endDate],
    queryFn: () => generateVirtualTodos(recurringRules, startDate, endDate),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: recurringRules.length > 0
  })
}
```

---

### 4. 🔀 Basic Smart Todo Merger  
**Dateien:** `src/hooks/useSmartTodos.ts` (neu)

**Definition of Done:**
- [ ] `useSmartTodos(year, month)` hook erstellt
- [ ] Merged real + virtual todos
- [ ] Real todos überschreiben virtual todos
- [ ] Sortierung nach Zeit

**Akzeptanzkriterien:**
- Real todo mit recurring_id versteckt virtual todo
- Sortierung: Zeit → virtual → real
- Memoization verhindert unnecessary re-renders
- API kompatibel mit bisherigem useQuery

**Code-Referenz:**
```tsx
// hooks/useSmartTodos.ts
export function useSmartTodos(year: number, month: number) {
  const startDate = dayjs(`${year}-${month + 1}-01`).format('YYYY-MM-DD')
  const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD')
  
  const { data: realTodos = [] } = useQuery(['todos', year, month])
  const { data: virtualTodos = [] } = useVirtualTodos(startDate, endDate)
  
  return useMemo(() => {
    return mergeAndSortTodos(realTodos, virtualTodos)
  }, [realTodos, virtualTodos])
}
```

---

### 5. ⚡ Smart Toggle Implementation
**Dateien:** `src/hooks/useSmartToggle.ts` (neu)

**Definition of Done:**
- [ ] `useSmartToggle()` mutation hook
- [ ] Auto-detection: virtual vs real todo
- [ ] Materialization logic für virtual todos
- [ ] Optimistic updates für beide types

**Akzeptanzkriterien:**
- Virtual todo toggle → materialisiert + speichert in DB
- Real todo toggle → normaler toggle
- Rollback funktioniert für beide Typen
- UI ist instant responsive

**Code-Referenz:**
```tsx
// hooks/useSmartToggle.ts
export function useSmartToggle() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ todo, newStatus }: ToggleParams) => {
      if (isVirtualTodo(todo)) {
        return materializeAndToggleTodo(todo, newStatus)
      } else {
        return todoService.toggle(todo.id, todo.is_done)
      }
    },
    // ... optimistic updates
  })
}
```

---

### 6. 🗑️ Smart Delete Implementation
**Dateien:** `src/hooks/useSmartDelete.ts` (neu)

**Definition of Done:**
- [ ] `useSmartDelete()` mutation hook
- [ ] Virtual todo delete → nur aus cache entfernen
- [ ] Real todo delete → DB delete
- [ ] Optimistic updates

**Akzeptanzkriterien:**
- Virtual todos verschwinden sofort
- Real todos werden aus DB gelöscht
- Cache wird korrekt aktualisiert
- Rollback bei Fehlern

---

### 7. 🔄 TodoPage Integration
**Dateien:** `src/pages/TodoPage.tsx`

**Definition of Done:**
- [ ] useSmartTodos() statt useQuery
- [ ] useSmartToggle() + useSmartDelete() integration
- [ ] Backwards compatibility gewährleistet
- [ ] Performance bleibt gleich oder besser

**Akzeptanzkriterien:**
- TodoPage funktioniert mit virtual + real todos
- UI bleibt unverändert für User
- Loading states funktionieren
- Realtime sync funktioniert weiterhin

---

### 8. 🧹 Manual DB Cleanup
**Dateien:** SQL Kommandos (manuell)

**Definition of Done:**
- [ ] Git commit als safepoint erstellt
- [ ] Alle recurring todo clones aus DB gelöscht
- [ ] App funktioniert nur mit virtual todos
- [ ] Performance-Test durchgeführt

**Akzeptanzkriterien:**
- DELETE FROM todos WHERE recurring_id IS NOT NULL
- Nur recurring_rules bleiben in DB
- Virtual todos werden korrekt angezeigt
- Keine Performance-Verschlechterung

---

### 9. 🏎️ Performance Optimizations
**Dateien:** `src/hooks/useVirtualTodoCache.ts` (neu)

**Definition of Done:**
- [ ] Background-Prefetching für next/prev month
- [ ] Memoization optimiert
- [ ] Bundle size analysis
- [ ] Performance benchmarks

**Akzeptanzkriterien:**
- Virtual generation unter 50ms
- Memory usage optimiert
- Smooth month navigation
- Bundle size nicht größer geworden

---

### 5. 🧹 Manual DB Cleanup (vor Go-Live)
**Dateien:** SQL Kommandos (manuell)

**Definition of Done:**
- [ ] Alle recurring todo clones aus DB gelöscht
- [ ] `recurring_todos` table bleibt unverändert (Master-Regeln)
- [ ] Clean slate für Virtual Todo System
- [ ] Git commit als safepoint erstellt

**Akzeptanzkriterien:**
- Alle todos mit recurring_id sind entfernt
- recurring_todos rules bleiben bestehen
- App funktioniert mit leerer todos table
- Virtual todos werden korrekt generiert

**Manual SQL:**
```sql
-- Alle recurring clones löschen
DELETE FROM todos WHERE recurring_id IS NOT NULL;

-- Verify: Nur manuelle todos bleiben
SELECT COUNT(*) FROM todos WHERE recurring_id IS NULL;
```

**Note:** Git commits dienen als rollback safety - keine DB backups nötig.

---

### 6. 🏎️ Performance Optimizations
**Dateien:** `src/hooks/useVirtualTodoCache.ts` (neu)

**Definition of Done:**
- [ ] Memoization für virtual todo generation
- [ ] Batch-Loading für mehrere Monate
- [ ] Background-Generation für next/prev month
- [ ] Memory-efficient caching strategy

**Akzeptanzkriterien:**
- Virtual todos generieren in <50ms
- Keine Memory leaks bei month navigation
- Smooth UX auch bei 100+ recurring rules
- Cache invalidation nur bei rule changes

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

## 🧪 Future Extensions (Phase 3)

- 📅 **Complex Recurrence Patterns** (every 2nd Tuesday)
- 🎨 **Todo Templates** with predefined fields
- 📊 **Analytics Dashboard** für recurring patterns
- 🔄 **Sync with External Calendars** (Google Calendar)
- 🤖 **AI-powered Todo Suggestions** based on patterns
- 👥 **Collaborative Recurring Lists** mit role-based permissions