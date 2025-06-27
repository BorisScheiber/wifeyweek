# 🎮 WifeyWeek App: Reaktive ToDos mit Realtime & Caching

## 🧠 Ziel

App lädt beim Start alle ToDos für 3 Monate, Änderungen werden sofort in der UI sichtbar, Supabase Realtime sorgt für Multi-Device Sync.

## ✅ Was wir schon haben

- ✅ Supabase mit todos + recurring_todos
- ✅ todoService mit allen CRUD Methoden
- ✅ TodoPage mit Monats-/Tagesansicht
- ✅ SwipeableItem Component
- ✅ Add/Edit Funktionalität

---

## 🔸 ROADMAP - Step by Step Implementation

### 1. 🧱 TanStack Query Setup ✅

**Dateien zu ändern:** `src/main.tsx`, `package.json`

**Definition of Done:**

- [x] `@tanstack/react-query` installiert
- [x] QueryClient in main.tsx konfiguriert
- [x] QueryClientProvider wrapper um App
- [x] DevTools aktiviert (development)

**Akzeptanzkriterien:**

- App startet ohne Fehler
- React Query DevTools sichtbar
- Console zeigt "QueryClient initialized"

**Code-Referenz:**

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});
```

---

### 2. 🗖️ TodoPage auf useQuery umstellen ✅

**Dateien zu ändern:** `src/pages/TodoPage.tsx`

**Definition of Done:**

- [x] `useState(todos)` entfernt
- [x] `useQuery` für todos implementiert
- [x] Error handling implementiert
- [x] Cache invalidation bei month/year change

**Akzeptanzkriterien:**

- [x] TodoPage lädt Daten über useQuery
- [x] Error message bei fetch failure
- [x] Monatswechsel triggert neue Query

**Code-Referenz:**

```tsx
const {
  data: todos = [],
  isLoading,
  error,
} = useQuery({
  queryKey: ["todos", year, month],
  queryFn: () => todoService.getByMonth(year, month),
  staleTime: 1000 * 60 * 5,
});
```

---

### 3. 📂 Prefetch für 3 Monate ✅

**Dateien zu ändern:** `src/pages/TodoPage.tsx`, `src/hooks/usePrefetchTodos.ts` (neu)

**Definition of Done:**

- [x] Hook `usePrefetchTodos` erstellt
- [x] Prefetch für current month ±1
- [x] Prefetch läuft im Hintergrund
- [x] Prefetch berücksichtigt Jahr-Wechsel

**Akzeptanzkriterien:**

- [x] 3 Monate werden automatisch prefetched
- [x] Cache zeigt prefetched data in DevTools
- [x] Navigation zwischen Monaten ist instant

**Code-Referenz:**

```tsx
// usePrefetchTodos.ts
export function usePrefetchTodos(currentYear: number, currentMonth: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const monthsToPreload = [
      { year: currentYear, month: currentMonth - 1 },
      { year: currentYear, month: currentMonth },
      { year: currentYear, month: currentMonth + 1 },
    ];
    // ... handle year boundaries
  }, [currentYear, currentMonth]);
}
```

---

### 4. ⚡ Optimistic Updates für Add, Toggle & Delete ✅

**Dateien zu ändern:** `src/pages/TodoPage.tsx`, `src/pages/CreateTodoPage.tsx`, `src/hooks/useTodoMutations.ts` (neu)

**Definition of Done:**

- [x] `useMutation` für add implementiert
- [x] `useMutation` für toggle implementiert
- [x] `useMutation` für delete implementiert
- [x] Optimistic updates mit rollback
- [x] Error handling mit console logging

**Akzeptanzkriterien:**

- [x] Add Todo ist sofort sichtbar
- [x] Toggle Todo ist sofort sichtbar
- [x] Delete Todo ist sofort sichtbar
- [x] Bei Netzwerk-Fehler: Rollback + Error message
- [x] Success feedback für User

**Code-Referenz:**

```tsx
const toggleMutation = useMutation({
  mutationFn: ({ id, is_done }: ToggleParams) =>
    todoService.toggle(id, is_done),
  onMutate: async ({ id }) => {
    // Optimistic update
    await queryClient.cancelQueries(["todos", year, month]);
    const previousTodos = queryClient.getQueryData(["todos", year, month]);

    queryClient.setQueryData(["todos", year, month], (old: Todo[]) =>
      old?.map((todo) =>
        todo.id === id ? { ...todo, is_done: !todo.is_done } : todo
      )
    );

    return { previousTodos };
  },
  onError: (err, variables, context) => {
    // Rollback
    queryClient.setQueryData(["todos", year, month], context?.previousTodos);
  },
});
```

---

### 5. 🧠 Supabase Realtime Integration ✅

**Dateien zu ändern:** `src/lib/supabaseClient.ts`, `src/hooks/useRealtimeSync.ts` (neu)

**Definition of Done:**

- [x] Realtime channel für "todos" table
- [x] Realtime channel für "recurring_todos" table
- [x] Query invalidation bei INSERT/UPDATE/DELETE
- [x] Connection state handling
- [x] Cleanup bei component unmount

**Akzeptanzkriterien:**

- [x] Änderungen von anderen Devices sofort sichtbar
- [x] Realtime connection status angezeigt
- [x] Keine Memory leaks bei navigation

**Code-Referenz:**

```tsx
// useRealtimeSync.ts
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          const changedDate = payload.new?.date || payload.old?.date;
          if (changedDate) {
            const date = dayjs(changedDate);
            queryClient.invalidateQueries(["todos", date.year(), date.month()]);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [queryClient]);
}
```

---

### 6. 🔄 Smart Query Invalidation ✅

**Dateien zu ändern:** `src/hooks/useTodoMutations.ts`

**Definition of Done:**

- [x] Granulare invalidation nur für betroffene Monate
- [x] Batch invalidation für recurring todos
- [x] Performance optimiert (keine unnecessary refetches)

**Akzeptanzkriterien:**

- [x] Nur betroffene Monate werden neu geladen
- [x] Multi-month recurring todos invalidieren richtig
- [x] Performance bleibt gut bei vielen todos

---

## 🧪 Bonus: Virtuelle Recurring ToDos (Phase 2)

**Erst nach Hauptfeatures implementieren**

---

## 🎯 Cursor Instructions

**Nach jedem abgeschlossenen Schritt:**

1. Alle Acceptance Criteria erfüllt ✅
2. Code getestet und funktionsfähig ✅
3. Diese Roadmap updaten (Status ändern) ✅
4. Kurzes Summary der Änderungen ✅

**Note: Commits werden manuell gemacht (für rollback flexibility)**

**Cursor Prompt Template:**

```
Implementiere Schritt X der WifeyWeek Roadmap.

ZIEL: [Definition of Done aus Roadmap]
DATEIEN: [Spezifische Dateien die geändert werden müssen]
AKZEPTANZ: [Alle Akzeptanzkriterien aus Roadmap]

Verwende die Code-Referenz als Basis, aber adaptiere sie für unsere spezifische Codebase.
Nach Implementierung: Update die Roadmap und markiere Schritt als ✅.
```
