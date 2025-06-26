# 🎮 WifeyWeek App: Reaktive ToDos mit Realtime & Caching

## 🧠 Ziel

App lädt beim Start alle ToDos für z. B. 3 Monate (z. B. Juni–August)

Änderungen (hinzufügen, löschen, bearbeiten) werden sofort in der UI sichtbar, ohne manuelles Reload

Supabase Realtime sorgt dafür, dass du über mehrere Geräte (z. B. du & deine Frau) immer die gleichen Daten siehst

## ✅ Was wir schon haben

* Supabase mit todos + recurring\_todos
* Upsert mit recurring\_id + UNIQUE Constraint
* Generierung der Monatsdaten bei Monatswechsel
* todoService mit allen nötigen Methoden
* Monatsansicht, Tagesansicht, Swipe-to-delete, Add-Funktion
* Reaktive Anzeige nach Änderung (durch Reload)

## 🕸️ Nächste Schritte (Roadmap)

### 1. 🧱 TanStack Query einführen

* `npm install @tanstack/react-query`
* Setup in `main.tsx` mit `QueryClientProvider`
* `QueryClient` anlegen und exportieren

### 2. 📆 Daten über TanStack cachen

* `useQuery(["todos", year, month], ...)` verwenden in `TodoPage`
* `todoService.getByMonth()` als `fetchFn` übergeben
* Kein manuelles `useState(todos)` mehr nötig

### 3. 📂 Prefetch für 3 Monate

* Beim App-Start (oder per Hintergrund-Task) alle gewünschten Monate vorladen:

```ts
queryClient.prefetchQuery(["todos", 2025, 6], ...)
queryClient.prefetchQuery(["todos", 2025, 7], ...)
queryClient.prefetchQuery(["todos", 2025, 8], ...)
```

* Optional: automatisiert über aktuellen Monat ±1/±2

### 4. ⚡ Optimistische Updates einbauen

* z. B. bei `todoService.toggle(...)`:

  * erst im Cache sofort `is_done` ändern
  * danach in Supabase bestätigen (oder rollback bei Fehler)

### 5. 🧠 Supabase Realtime aktivieren

* `npm install @supabase/realtime-js` (bzw. ist oft schon enthalten)
* Supabase-Client konfigurieren:

```ts
supabase
  .channel("todos-changes")
  .on("postgres_changes", { event: "*", schema: "public", table: "todos" }, (payload) => {
    queryClient.invalidateQueries(["todos", payload.new.date]);
  })
  .subscribe();
```

### 6. 🔄 Queries automatisch invalidieren

* z. B. wenn ein Todo im Juli geändert wird:

```ts
queryClient.invalidateQueries(["todos", 2025, 7]);
```

### 7. 🛡️ Fallback & Offline

* `useQuery` mit `staleTime`, `cacheTime`, `refetchOnWindowFocus` etc. konfigurieren
* Für Offline-Nutzung ggf. PWA mit IndexedDB später

## 🧹 Bonus Features danach

* Aufgaben-Farben pro Badge (Hubby/Wifey)
* Realtime-Chat oder Notifications
* ToDo-Sync mit Kalendersystemen (z. B. Google Calendar)
* PWA-Installation (Icon + Homescreen)

## 🚀 Zusammenfassung

| Feature                       | Status         | Umsetzung                |
| ----------------------------- | -------------- | ------------------------ |
| Monatsgenerierung             | ✅ Fertig       | Supabase + Upsert        |
| Lokaler Cache (monatlich)     | 🕸️ Ausstehend | TanStack Query           |
| Realtime-Updates              | 🕸️ Ausstehend | Supabase Realtime        |
| Optimistische UI              | 🕸️ Ausstehend | useMutation etc.         |
| Prefetching 3 Monate          | 🕸️ Ausstehend | `queryClient.prefetch`   |
| Datenverwaltung zentralisiert | 🕸️ Ausstehend | `todoService` + TanStack |
