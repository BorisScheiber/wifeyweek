import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { todoService, type Todo } from "../services/todoService";
import { useVirtualTodos } from "./useVirtualTodos";
import {
  type SmartTodo,
  type VirtualTodo,
  isVirtualTodo,
  isRealTodo,
} from "../types/virtualTodo";

// 🚀 Performance-Optimierung: Cache entfernt - wird aktuell nicht verwendet

/**
 * Merged reale und virtuelle Todos intelligent
 * Reale Todos überschreiben virtuelle Todos mit gleichem recurring_id und Datum
 *
 * @param realTodos Array von echten Todos aus der DB
 * @param virtualTodos Array von virtuellen Todos
 * @returns Merged und sortierte SmartTodos
 */
function mergeAndSortTodos(
  realTodos: Todo[],
  virtualTodos: VirtualTodo[]
): SmartTodo[] {
  // Performance-Optimierung: Erstelle ein Set von real todo keys für schnelle Lookups
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

  // Sortiere nach Zeit, dann nach Typ (reale vor virtuellen)
  mergedTodos.sort((a, b) => {
    // Primäre Sortierung: Nach Zeit
    if (a.time && b.time) {
      const timeComparison = a.time.localeCompare(b.time);
      if (timeComparison !== 0) return timeComparison;
    }

    // Todos ohne Zeit kommen nach Todos mit Zeit
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;

    // Sekundäre Sortierung: Bei gleicher Zeit - reale vor virtuellen
    if (isRealTodo(a) && isVirtualTodo(b)) return -1;
    if (isVirtualTodo(a) && isRealTodo(b)) return 1;

    // Tertiäre Sortierung: Bei gleichen Typen nach Titel
    return a.title.localeCompare(b.title);
  });

  return mergedTodos;
}

/**
 * Hook für Smart Todos - Merger von realen und virtuellen Todos
 * Ersetzt das bisherige useQuery für Todos und bietet die gleiche API
 *
 * @param year Jahr (z.B. 2024)
 * @param month Monat (0-11, wie in JavaScript Date)
 * @returns useQuery-kompatibles result mit SmartTodos
 */
export function useSmartTodos(year: number, month: number) {
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
    queryFn: () => todoService.getByMonth(year, month), // Direkt ohne generateRecurringTodosForMonth
    staleTime: 1000 * 60 * 5, // 5 Minuten wie bisher
  });

  // Lade virtuelle Todos
  const {
    data: virtualTodos = [],
    isLoading: isLoadingVirtual,
    error: virtualError,
    isFetching: isFetchingVirtual,
    isSuccess: isSuccessVirtual,
  } = useVirtualTodos(startDate, endDate);

  // Merge und sortiere Todos (memoized für Performance)
  const mergedTodos = useMemo(() => {
    if (!isSuccessReal && !isSuccessVirtual) {
      return [];
    }

    const result = mergeAndSortTodos(realTodos, virtualTodos);

    // Performance Logging in Development
    if (process.env.NODE_ENV === "development") {
      console.log("🔀 Smart Todo Merger:", {
        month: `${year}-${month + 1}`,
        realTodos: realTodos.length,
        virtualTodos: virtualTodos.length,
        filteredVirtuals: result.filter(isVirtualTodo).length,
        totalMerged: result.length,
      });
    }

    return result;
  }, [realTodos, virtualTodos, isSuccessReal, isSuccessVirtual, year, month]);

  // Kombiniere Loading States
  const isLoading = isLoadingReal || isLoadingVirtual;

  // Kombiniere Fetching States
  const isFetching = isFetchingReal || isFetchingVirtual;

  // Kombiniere Errors
  const error = realError || virtualError;

  // Success nur wenn beide erfolgreich sind
  const isSuccess = isSuccessReal && isSuccessVirtual;

  // Return useQuery-kompatible API
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
  };
}

/**
 * Hook für Smart Todos eines bestimmten Datums
 * Filtert SmartTodos für ein spezifisches Datum
 *
 * @param year Jahr
 * @param month Monat (0-11)
 * @param date Tag des Monats (1-31)
 * @returns Gefilterte SmartTodos für das Datum
 */
export function useSmartTodosByDate(year: number, month: number, date: number) {
  const { data: allTodos = [], ...rest } = useSmartTodos(year, month);

  const targetDate = dayjs()
    .year(year)
    .month(month)
    .date(date)
    .format("YYYY-MM-DD");

  const filteredTodos = useMemo(() => {
    return allTodos.filter((todo) => todo.date === targetDate);
  }, [allTodos, targetDate]);

  return {
    ...rest,
    data: filteredTodos,
  };
}

/**
 * Utility function: Prüft ob ein SmartTodo materialisiert werden muss
 * Virtual Todos müssen materialisiert werden wenn sie interagiert werden
 *
 * @param todo SmartTodo
 * @returns true wenn das Todo materialisiert werden muss
 */
export function needsMaterialization(todo: SmartTodo): boolean {
  return isVirtualTodo(todo);
}

/**
 * Utility function: Extrahiert alle unique recurring_ids aus SmartTodos
 * Nützlich für Batch-Operations
 *
 * @param todos Array von SmartTodos
 * @returns Set von recurring_ids
 */
export function getRecurringIds(todos: SmartTodo[]): Set<string> {
  const recurringIds = new Set<string>();

  todos.forEach((todo) => {
    if (todo.recurring_id) {
      recurringIds.add(todo.recurring_id);
    }
  });

  return recurringIds;
}
