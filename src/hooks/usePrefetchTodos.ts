import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { todoService } from "../services/todoService";

export function usePrefetchTodos(currentYear: number, currentMonth: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Berechne die 3 Monate: current ±1 mit Jahr-Wechsel handling
    const monthsToPreload = [];

    // Vorheriger Monat
    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth < 0) {
      prevMonth = 11; // Dezember
      prevYear = currentYear - 1;
    }
    monthsToPreload.push({ year: prevYear, month: prevMonth });

    // Aktueller Monat
    monthsToPreload.push({ year: currentYear, month: currentMonth });

    // Nächster Monat
    let nextYear = currentYear;
    let nextMonth = currentMonth + 1;
    if (nextMonth > 11) {
      nextMonth = 0; // Januar
      nextYear = currentYear + 1;
    }
    monthsToPreload.push({ year: nextYear, month: nextMonth });

    // Prefetch alle 3 Monate im Hintergrund
    monthsToPreload.forEach(({ year, month }) => {
      queryClient.prefetchQuery({
        queryKey: ["todos", year, month],
        queryFn: async () => {
          // Gleiche Logik wie in TodoPage: erst recurring generieren, dann laden
          await todoService.generateRecurringTodosForMonth(year, month);
          return todoService.getByMonth(year, month);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    });

    console.log(
      `Prefetching todos für:`,
      monthsToPreload
        .map(({ year, month }) => `${year}-${month + 1}`)
        .join(", ")
    );
  }, [currentYear, currentMonth, queryClient]);
}
