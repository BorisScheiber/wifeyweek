import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { todoService, type Todo } from "../services/todoService";
import { useVirtualTodos } from "./useVirtualTodos";
import {
  type SmartTodo,
  type VirtualTodo,
  isRealTodo,
} from "../types/virtualTodo";

// 🚀 Performance-Optimierung: Memoized Merge-Function Cache
const mergeCache = new Map<string, SmartTodo[]>();
const MAX_MERGE_CACHE_SIZE = 20;

/**
 * 🎯 Cache-Key für Merge-Operationen
 */
function createMergeKey(
  realTodos: Todo[],
  virtualTodos: VirtualTodo[]
): string {
  const realKey = realTodos.map((t) => `${t.id}_${t.is_done}`).join("|");
  const virtualKey = virtualTodos
    .map((t) => `${t.id}_${t.recurring_id}`)
    .join("|");
  return `${realKey}__${virtualKey}`;
}

/**
 * 🧹 Cache-Management für Merge-Cache
 */
function manageMergeCache() {
  if (mergeCache.size >= MAX_MERGE_CACHE_SIZE) {
    const keysToDelete = Array.from(mergeCache.keys()).slice(0, 5);
    keysToDelete.forEach((key) => mergeCache.delete(key));
    console.log(
      `🧹 Merge Cache bereinigt: ${keysToDelete.length} Einträge entfernt`
    );
  }
}

/**
 * 🚀 OPTIMIERT: Merged reale und virtuelle Todos mit Memoization
 * Performance-Verbesserungen:
 * - Set-basierte Lookups für O(1) Performance
 * - Intelligente Sortierung mit mehreren Kriterien
 * - Result-Caching für identische Eingaben
 */
function mergeAndSortTodosOptimized(
  realTodos: Todo[],
  virtualTodos: VirtualTodo[]
): SmartTodo[] {
  // 🎯 Cache-Check für identische Merge-Operationen
  const cacheKey = createMergeKey(realTodos, virtualTodos);
  const cachedResult = mergeCache.get(cacheKey);

  if (cachedResult) {
    console.log(`⚡ Merge Cache Hit: ${cachedResult.length} todos`);
    return cachedResult;
  }

  const startTime = performance.now();

  // Performance-Optimierung: Erstelle ein Set von real todo keys für O(1) Lookups
  const realTodoKeys = new Set<string>();
  realTodos.forEach((todo) => {
    if (todo.recurring_id && todo.date) {
      realTodoKeys.add(`${todo.recurring_id}_${todo.date}`);
    }
  });

  // Filtere virtuelle Todos: Entferne die, die bereits als reale Todos existieren
  const filteredVirtualTodos = virtualTodos.filter((virtualTodo) => {
    const key = `${virtualTodo.recurring_id}_${virtualTodo.date}`;
    return !realTodoKeys.has(key);
  });

  // Kombiniere beide Arrays
  const mergedTodos: SmartTodo[] = [...realTodos, ...filteredVirtualTodos];

  // 🚀 Optimierte Sortierung mit mehreren Kriterien
  mergedTodos.sort((a, b) => {
    // Primäre Sortierung: Nach Zeit
    const aTime = a.time || "99:99"; // Todos ohne Zeit kommen ans Ende
    const bTime = b.time || "99:99";

    const timeComparison = aTime.localeCompare(bTime);
    if (timeComparison !== 0) return timeComparison;

    // Sekundäre Sortierung: Bei gleicher Zeit - reale vor virtuellen
    const aIsReal = isRealTodo(a) ? 1 : 0;
    const bIsReal = isRealTodo(b) ? 1 : 0;
    if (aIsReal !== bIsReal) return bIsReal - aIsReal; // Real todos first

    // Tertiäre Sortierung: Bei gleichen Typen nach Titel
    return a.title.localeCompare(b.title);
  });

  const duration = performance.now() - startTime;

  // Performance-Logging für Optimization-Tracking
  if (process.env.NODE_ENV === "development") {
    console.log("🔀 Smart Todo Merge Performance:", {
      realTodos: realTodos.length,
      virtualTodos: virtualTodos.length,
      filteredVirtuals: filteredVirtualTodos.length,
      totalMerged: mergedTodos.length,
      duration: `${duration.toFixed(2)}ms`,
      cacheSize: mergeCache.size,
    });
  }

  // 🧹 Cache das Ergebnis für zukünftige Verwendung
  manageMergeCache();
  mergeCache.set(cacheKey, mergedTodos);

  return mergedTodos;
}

/**
 * 🚀 OPTIMIERT: Hook für Smart Todos mit Performance-Verbesserungen
 *
 * Performance-Optimierungen:
 * - Memoized merge-Funktion
 * - Background-Prefetching für benachbarte Monate
 * - Erweiterte Cache-Strategien
 * - Performance-Monitoring
 *
 * @param year Jahr (z.B. 2024)
 * @param month Monat (0-11, wie in JavaScript Date)
 * @returns useQuery-kompatibles result mit SmartTodos
 */
export function useSmartTodosOptimized(year: number, month: number) {
  const queryClient = useQueryClient();

  // Berechne Monatsanfang und -ende für Virtual Todos
  const startDate = dayjs()
    .year(year)
    .month(month)
    .startOf("month")
    .format("YYYY-MM-DD");
  const endDate = dayjs()
    .year(year)
    .month(month)
    .endOf("month")
    .format("YYYY-MM-DD");

  // Lade reale Todos (OHNE die alte DB-Generation)
  const {
    data: realTodos = [],
    isLoading: isLoadingReal,
    error: realError,
    isFetching: isFetchingReal,
    isSuccess: isSuccessReal,
  } = useQuery({
    queryKey: ["todos", year, month],
    queryFn: () => todoService.getByMonth(year, month),
    staleTime: 1000 * 60 * 8, // 🚀 8 Minuten - etwas länger für bessere Performance
    gcTime: 1000 * 60 * 20, // 20 Minuten Garbage Collection
  });

  // Lade virtuelle Todos mit optimiertem Hook
  const {
    data: virtualTodos = [],
    isLoading: isLoadingVirtual,
    error: virtualError,
    isFetching: isFetchingVirtual,
    isSuccess: isSuccessVirtual,
  } = useVirtualTodos(startDate, endDate);

  // 🚀 Memoized Merge mit Performance-Optimierungen
  const mergedTodos = useMemo(() => {
    if (!isSuccessReal && !isSuccessVirtual) {
      return [];
    }

    const startTime = performance.now();
    const result = mergeAndSortTodosOptimized(realTodos, virtualTodos);
    const duration = performance.now() - startTime;

    // Performance Logging in Development
    if (process.env.NODE_ENV === "development") {
      console.log("🎯 useSmartTodos Performance:", {
        month: `${year}-${month + 1}`,
        realTodos: realTodos.length,
        virtualTodos: virtualTodos.length,
        mergedTodos: result.length,
        mergeDuration: `${duration.toFixed(2)}ms`,
        isFromCache: duration < 1, // Cache-Hits sind <1ms
      });
    }

    return result;
  }, [realTodos, virtualTodos, isSuccessReal, isSuccessVirtual, year, month]);

  // 🚀 Background-Prefetching für benachbarte Monate
  const prefetchAdjacentMonths = useCallback(async () => {
    if (!isSuccessReal || !isSuccessVirtual) return;

    // Berechne vorherigen und nächsten Monat
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    // Background-Prefetching ohne UI-Blocking
    setTimeout(() => {
      // Prefetch vorheriger Monat
      queryClient.prefetchQuery({
        queryKey: ["todos", prevYear, prevMonth],
        queryFn: () => todoService.getByMonth(prevYear, prevMonth),
        staleTime: 1000 * 60 * 8,
      });

      // Prefetch nächster Monat
      queryClient.prefetchQuery({
        queryKey: ["todos", nextYear, nextMonth],
        queryFn: () => todoService.getByMonth(nextYear, nextMonth),
        staleTime: 1000 * 60 * 8,
      });

      console.log(
        `🚀 Background-Prefetching für ${prevYear}-${
          prevMonth + 1
        } und ${nextYear}-${nextMonth + 1} gestartet`
      );
    }, 300); // Delay um aktuellen Load nicht zu beeinträchtigen
  }, [year, month, isSuccessReal, isSuccessVirtual, queryClient]);

  // Trigger Background-Prefetching
  useMemo(() => {
    prefetchAdjacentMonths();
  }, [prefetchAdjacentMonths]);

  // Kombiniere Loading States
  const isLoading = isLoadingReal || isLoadingVirtual;

  // Kombiniere Fetching States
  const isFetching = isFetchingReal || isFetchingVirtual;

  // Kombiniere Errors
  const error = realError || virtualError;

  // Success nur wenn beide erfolgreich sind
  const isSuccess = isSuccessReal && isSuccessVirtual;

  // Return useQuery-kompatible API mit Performance-Metriken
  return {
    data: mergedTodos,
    isLoading,
    error,
    isSuccess,
    isFetching,

    // Debug info für advanced use cases
    realTodos,
    virtualTodos,
    isLoadingReal,
    isLoadingVirtual,
    realError,
    virtualError,

    // 🎯 Performance-Metriken
    performanceInfo: {
      totalTodos: mergedTodos.length,
      realTodosCount: realTodos.length,
      virtualTodosCount: virtualTodos.length,
      mergeCacheSize: mergeCache.size,
    },
  };
}

/**
 * 🧹 Cache-Reset: Bereinigt alle Performance-Caches
 */
export function clearSmartTodosCache() {
  mergeCache.clear();
  console.log("🧹 Smart Todos Merge Cache vollständig bereinigt");
}

// Backwards-Compatibility: Export als Standard-Implementation
export const useSmartTodos = useSmartTodosOptimized;
