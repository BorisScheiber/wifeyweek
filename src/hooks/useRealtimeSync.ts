import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log("🔴 Supabase Realtime: Initialisiere channels...");

    // Channel für todos Tabelle
    const todosChannel = supabase
      .channel("todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "todos" },
        (payload) => {
          console.log("🔵 Todos Realtime Event:", payload.eventType, payload);

          // Bestimme das betroffene Datum
          const changedDate =
            (payload.new as Record<string, unknown>)?.date ||
            (payload.old as Record<string, unknown>)?.date;

          if (changedDate && typeof changedDate === "string") {
            const date = dayjs(changedDate);
            const queryKey = ["todos", date.year(), date.month()];

            console.log(
              `🔄 Invalidiere Query für Monat: ${date.format("YYYY-MM")}`
            );
            queryClient.invalidateQueries({ queryKey });
          } else {
            console.warn(
              "⚠️ Kein Datum in todos payload gefunden, invalidiere alle"
            );
            // Fallback: Invalidiere alle todos queries
            queryClient.invalidateQueries({ queryKey: ["todos"] });
          }
        }
      )
      .subscribe();

    // Channel für recurring_todos Tabelle
    const recurringTodosChannel = supabase
      .channel("recurring_todos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recurring_todos" },
        (payload) => {
          console.log(
            "🟡 Recurring Todos Realtime Event:",
            payload.eventType,
            payload
          );

          // Bei recurring_todos Änderungen: Invalidiere alle prefetched Monate
          // da recurring todos mehrere Monate betreffen können
          const start_date =
            (payload.new as Record<string, unknown>)?.start_date ||
            (payload.old as Record<string, unknown>)?.start_date;

          if (start_date && typeof start_date === "string") {
            const startDate = dayjs(start_date);

            // Invalidiere die nächsten 12 Monate ab start_date
            const monthsToInvalidate = [];
            for (let i = 0; i < 12; i++) {
              const targetMonth = startDate.add(i, "month");
              monthsToInvalidate.push([
                "todos",
                targetMonth.year(),
                targetMonth.month(),
              ]);
            }

            console.log(
              `🔄 Invalidiere ${
                monthsToInvalidate.length
              } Monate ab ${startDate.format("YYYY-MM")}`
            );

            // Invalidiere alle betroffenen Monate
            monthsToInvalidate.forEach((queryKey) => {
              queryClient.invalidateQueries({ queryKey });
            });
          } else {
            console.warn(
              "⚠️ Kein start_date in recurring_todos payload, invalidiere alle"
            );
            // Fallback: Invalidiere alle todos queries
            queryClient.invalidateQueries({ queryKey: ["todos"] });
          }
        }
      )
      .subscribe();

    // Connection Status Logging
    const handleConnectionChange = (status: string, error?: unknown) => {
      console.log(`📡 Supabase Realtime Status: ${status}`, error || "");
    };

    // Subscribe zu Connection Events
    todosChannel.on("system", {}, (payload) => {
      handleConnectionChange(`todos-${payload.status}`, payload.error);
    });

    recurringTodosChannel.on("system", {}, (payload) => {
      handleConnectionChange(
        `recurring_todos-${payload.status}`,
        payload.error
      );
    });

    console.log("✅ Realtime channels erfolgreich eingerichtet");

    // Cleanup function
    return () => {
      console.log("🧹 Supabase Realtime: Cleanup channels...");

      supabase.removeChannel(todosChannel);
      supabase.removeChannel(recurringTodosChannel);

      console.log("✅ Realtime channels entfernt");
    };
  }, [queryClient]);

  // Return connection helper for debugging
  return {
    // Für debugging: zeige aktuelle channel subscriptions
    getChannelInfo: () => {
      const channels = supabase.getChannels();
      console.log("📊 Aktive Realtime Channels:", channels.length);
      return channels;
    },
  };
}
