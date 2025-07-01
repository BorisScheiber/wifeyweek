import { useQuery, useQueryClient } from "@tanstack/react-query";
import { todoService } from "../services/todoService";
import { generateVirtualTodos } from "../utils/virtualTodoGenerator";
import type { VirtualTodo } from "../types/virtualTodo";
import { useEffect } from "react";
import dayjs from "dayjs";

/**
 * 🚀 OPTIMIERT: Hook für Virtual Todo Caching mit Background-Prefetching
 * Lädt RecurringTodos und generiert daraus Virtual Todos für einen Datumsbereich
 *
 * @param startDate Startdatum des Bereichs (YYYY-MM-DD)
 * @param endDate Enddatum des Bereichs (YYYY-MM-DD)
 * @returns useQuery result mit Virtual Todos
 */
export function useVirtualTodos(startDate: string, endDate: string) {
  const queryClient = useQueryClient();

  // Query für alle RecurringTodo-Regeln (erweiterte Cache-Zeit)
  const {
    data: recurringRules = [],
    isLoading: isLoadingRules,
    error: rulesError,
  } = useQuery({
    queryKey: ["recurring-rules"],
    queryFn: () => todoService.getAllRecurringTodos(),
    staleTime: 1000 * 60 * 15, // 🚀 15 Minuten - RecurringTodos ändern sich sehr selten
    gcTime: 1000 * 60 * 30, // 30 Minuten Garbage Collection
    refetchOnWindowFocus: false, // Verhindert unnecessary refetches
  });

  // Query für Virtual Todos basierend auf RecurringTodo-Regeln
  const virtualTodosQuery = useQuery({
    queryKey: ["virtual-todos", startDate, endDate],
    queryFn: async (): Promise<VirtualTodo[]> => {
      console.log(
        `🧙‍♂️ Generiere Virtual Todos für ${startDate} bis ${endDate} mit ${recurringRules.length} Regeln`
      );

      return generateVirtualTodos(recurringRules, startDate, endDate);
    },
    staleTime: 1000 * 60 * 15, // 🚀 15 Minuten Cache (länger für bessere Performance)
    gcTime: 1000 * 60 * 30, // 30 Minuten Garbage Collection
    enabled: !isLoadingRules && recurringRules.length >= 0, // Enabled wenn rules geladen (auch bei 0 rules)
    refetchOnWindowFocus: false, // Virtual todos ändern sich nur bei rule changes
  });

  // 🚀 Background-Prefetching für benachbarte Zeiträume
  useEffect(() => {
    if (!isLoadingRules && recurringRules.length > 0) {
      const startDateObj = dayjs(startDate);
      const endDateObj = dayjs(endDate);
      const rangeDays = endDateObj.diff(startDateObj, "day");

      // Prefetch vorherigen Zeitraum
      const prevStartDate = startDateObj
        .subtract(rangeDays + 1, "day")
        .format("YYYY-MM-DD");
      const prevEndDate = startDateObj.subtract(1, "day").format("YYYY-MM-DD");

      // Prefetch nächsten Zeitraum
      const nextStartDate = endDateObj.add(1, "day").format("YYYY-MM-DD");
      const nextEndDate = endDateObj
        .add(rangeDays + 1, "day")
        .format("YYYY-MM-DD");

      // Background-Prefetching (ohne UI-Blocking)
      setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: ["virtual-todos", prevStartDate, prevEndDate],
          queryFn: () =>
            generateVirtualTodos(recurringRules, prevStartDate, prevEndDate),
          staleTime: 1000 * 60 * 15,
        });

        queryClient.prefetchQuery({
          queryKey: ["virtual-todos", nextStartDate, nextEndDate],
          queryFn: () =>
            generateVirtualTodos(recurringRules, nextStartDate, nextEndDate),
          staleTime: 1000 * 60 * 15,
        });

        console.log(
          `🚀 Background-Prefetching abgeschlossen für benachbarte Zeiträume`
        );
      }, 100); // Kleines Delay um UI nicht zu blockieren
    }
  }, [startDate, endDate, recurringRules, isLoadingRules, queryClient]);

  // Kombiniere Loading States
  const isLoading =
    isLoadingRules || (virtualTodosQuery.isLoading && !isLoadingRules);

  // Kombiniere Errors
  const error = rulesError || virtualTodosQuery.error;

  // 🎯 Erweiterte Debug-Informationen für Performance-Monitoring
  if (process.env.NODE_ENV === "development") {
    const daysSpan = dayjs(endDate).diff(dayjs(startDate), "day");
    console.log("🎯 useVirtualTodos Performance Debug:", {
      startDate,
      endDate,
      daysSpan,
      recurringRulesCount: recurringRules.length,
      virtualTodosCount: virtualTodosQuery.data?.length || 0,
      isLoadingRules,
      isLoadingVirtual: virtualTodosQuery.isLoading,
      isEnabled: !isLoadingRules && recurringRules.length >= 0,
      cacheStatus: virtualTodosQuery.isFetched ? "cached" : "fresh",
    });
  }

  return {
    data: virtualTodosQuery.data || [],
    isLoading,
    error,
    isSuccess: virtualTodosQuery.isSuccess,
    isFetching: virtualTodosQuery.isFetching,

    // Expose individual query states für advanced use cases
    recurringRules,
    isLoadingRules,
    rulesError,

    // Query utilities
    refetch: virtualTodosQuery.refetch,
  };
}

/**
 * 🚀 OPTIMIERT: Hook für Virtual Todos eines bestimmten Monats mit Batch-Prefetching
 * Wrapper um useVirtualTodos mit Monats-spezifischen Grenzen
 *
 * @param year Jahr (z.B. 2024)
 * @param month Monat (0-11, wie in JavaScript Date)
 * @returns useQuery result mit Virtual Todos für den Monat
 */
export function useVirtualTodosForMonth(year: number, month: number) {
  const queryClient = useQueryClient();

  // Berechne Monatsanfang und -ende
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endOfMonth = new Date(year, month + 1, 0).getDate(); // Letzter Tag des Monats
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    endOfMonth
  ).padStart(2, "0")}`;

  const result = useVirtualTodos(startDate, endDate);

  // 🚀 Batch-Prefetching für benachbarte Monate
  useEffect(() => {
    if (!result.isLoadingRules && result.recurringRules.length > 0) {
      // Prefetch vorheriger Monat
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 0) {
        prevMonth = 11;
        prevYear = year - 1;
      }

      // Prefetch nächster Monat
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
      }

      // Background-Prefetching für benachbarte Monate
      setTimeout(() => {
        // Vorheriger Monat
        const prevStartDate = `${prevYear}-${String(prevMonth + 1).padStart(
          2,
          "0"
        )}-01`;
        const prevEndOfMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
        const prevEndDate = `${prevYear}-${String(prevMonth + 1).padStart(
          2,
          "0"
        )}-${String(prevEndOfMonth).padStart(2, "0")}`;

        queryClient.prefetchQuery({
          queryKey: ["virtual-todos", prevStartDate, prevEndDate],
          queryFn: () =>
            generateVirtualTodos(
              result.recurringRules,
              prevStartDate,
              prevEndDate
            ),
          staleTime: 1000 * 60 * 15,
        });

        // Nächster Monat
        const nextStartDate = `${nextYear}-${String(nextMonth + 1).padStart(
          2,
          "0"
        )}-01`;
        const nextEndOfMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
        const nextEndDate = `${nextYear}-${String(nextMonth + 1).padStart(
          2,
          "0"
        )}-${String(nextEndOfMonth).padStart(2, "0")}`;

        queryClient.prefetchQuery({
          queryKey: ["virtual-todos", nextStartDate, nextEndDate],
          queryFn: () =>
            generateVirtualTodos(
              result.recurringRules,
              nextStartDate,
              nextEndDate
            ),
          staleTime: 1000 * 60 * 15,
        });

        console.log(
          `🚀 Batch-Prefetching für ${prevYear}-${
            prevMonth + 1
          } und ${nextYear}-${nextMonth + 1} abgeschlossen`
        );
      }, 200);
    }
  }, [year, month, result.recurringRules, result.isLoadingRules, queryClient]);

  return result;
}

/**
 * Hook für Virtual Todos der nächsten X Tage (Performance-optimiert)
 * Nützlich für Dashboard Views oder schnelle Übersichten
 *
 * @param days Anzahl Tage in die Zukunft (Standard: 30)
 * @returns useQuery result mit Virtual Todos
 */
export function useVirtualTodosUpcoming(days: number = 30) {
  const today = new Date();
  const startDate = today.toISOString().split("T")[0]; // Heute

  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + days);
  const endDate = futureDate.toISOString().split("T")[0];

  return useVirtualTodos(startDate, endDate);
}
