import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { todoService, type Todo } from "../services/todoService";
import {
  type SmartTodo,
  type VirtualTodo,
  isVirtualTodo,
  isRealTodo,
} from "../types/virtualTodo";

// Parameter Types für Smart Toggle
type SmartToggleParams = {
  todo: SmartTodo;
  newStatus?: boolean; // Optional: wenn nicht angegeben, wird is_done getoggelt
};

/**
 * Materialisiert ein Virtual Todo zu einem Real Todo in der DB
 * @param virtualTodo Das zu materialisierende Virtual Todo
 * @param newStatus Der neue is_done Status
 * @returns Promise mit dem materialisierten Todo
 */
async function materializeVirtualTodo(
  virtualTodo: VirtualTodo,
  newStatus: boolean
): Promise<Todo> {
  // Erstelle Real Todo Object aus Virtual Todo
  const materializedTodo = {
    title: virtualTodo.title,
    date: virtualTodo.date!,
    time: virtualTodo.time || null,
    is_done: newStatus,
    recurring_id: virtualTodo.recurring_id,
  };

  // Speichere in DB via upsert (verhindert Duplikate)
  await todoService.add(materializedTodo);

  // Generiere eine Real Todo Structure für den Return
  const realTodo: Todo = {
    id: `materialized-${Date.now()}`, // Temporäre ID bis zum DB-refresh
    title: materializedTodo.title,
    date: materializedTodo.date,
    time: materializedTodo.time || undefined,
    is_done: materializedTodo.is_done,
    created_at: new Date().toISOString(),
    recurring_id: materializedTodo.recurring_id,
  };

  console.log(
    `🧙‍♂️ Virtual Todo materialisiert: ${virtualTodo.title} (${virtualTodo.date})`
  );

  return realTodo;
}

/**
 * Smart Toggle Hook - Handelt Real und Virtual Todos intelligent
 * @returns useMutation Hook für Smart Toggle Operations
 */
export function useSmartToggle() {
  const queryClient = useQueryClient();

  // Helper: Query Key für ein bestimmtes Datum berechnen
  const getQueryKeyForDate = (date: string) => {
    const dateObj = dayjs(date);
    return ["todos", dateObj.year(), dateObj.month()];
  };

  return useMutation({
    mutationFn: async ({ todo, newStatus }: SmartToggleParams) => {
      const finalStatus = newStatus !== undefined ? newStatus : !todo.is_done;

      if (isVirtualTodo(todo)) {
        // Virtual Todo → Materialisierung + Toggle
        console.log(`⚡ Virtual Todo Toggle: ${todo.title} → ${finalStatus}`);
        return await materializeVirtualTodo(todo, finalStatus);
      } else if (isRealTodo(todo)) {
        // Real Todo → Normaler Toggle
        console.log(`⚡ Real Todo Toggle: ${todo.title} → ${finalStatus}`);
        await todoService.toggle(todo.id, todo.is_done);
        return { ...todo, is_done: finalStatus };
      } else {
        throw new Error("Unbekannter Todo-Typ für Smart Toggle");
      }
    },

    onMutate: async ({ todo, newStatus }) => {
      const finalStatus = newStatus !== undefined ? newStatus : !todo.is_done;
      const affectedQueryKey = getQueryKeyForDate(todo.date!);

      // Cancel outgoing queries für den betroffenen Monat
      await queryClient.cancelQueries({ queryKey: affectedQueryKey });

      // Snapshot previous state
      const previousTodos = queryClient.getQueryData<Todo[]>(affectedQueryKey);

      if (isVirtualTodo(todo)) {
        // Optimistic Update für Virtual Todo: Entferne Virtual, füge Real hinzu
        queryClient.setQueryData<Todo[]>(affectedQueryKey, (old = []) => {
          // Entferne das virtual todo
          const withoutVirtual = old.filter((t) => t.id !== todo.id);

          // Füge materialisiertes Real Todo hinzu
          const materializedReal: Todo = {
            id: `optimistic-${Date.now()}`,
            title: todo.title,
            date: todo.date!,
            time: todo.time,
            is_done: finalStatus,
            created_at: new Date().toISOString(),
            recurring_id: todo.recurring_id,
          };

          return [...withoutVirtual, materializedReal];
        });

        console.log(
          `🔮 Optimistic: Virtual → Real materialization für ${todo.title}`
        );
      } else if (isRealTodo(todo)) {
        // Optimistic Update für Real Todo: Normale Toggle-Logic
        queryClient.setQueryData<Todo[]>(affectedQueryKey, (old = []) =>
          old.map((t) =>
            t.id === todo.id ? { ...t, is_done: finalStatus } : t
          )
        );

        console.log(`🔮 Optimistic: Real Todo toggle für ${todo.title}`);
      }

      return {
        previousTodos,
        affectedQueryKey,
        isVirtual: isVirtualTodo(todo),
        todo,
        finalStatus,
      };
    },

    onError: (error, variables, context) => {
      console.error("❌ Smart Toggle Fehler:", error);

      // Rollback optimistic update
      if (context?.previousTodos && context?.affectedQueryKey) {
        queryClient.setQueryData(
          context.affectedQueryKey,
          context.previousTodos
        );

        const todoType = context.isVirtual ? "Virtual" : "Real";
        console.log(
          `🔄 Rollback: ${todoType} Todo "${context.todo.title}" zurückgesetzt`
        );
      }
    },

    onSuccess: (result, variables, context) => {
      // Invalidate nur den betroffenen Monat für fresh data
      if (context?.affectedQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.affectedQueryKey });

        // Bei Virtual Todo Materialization: Invalidate auch Virtual Todo Caches
        if (context.isVirtual) {
          queryClient.invalidateQueries({ queryKey: ["virtual-todos"] });
          console.log("🧙‍♂️ Virtual Todo Cache invalidiert nach Materialization");
        }
      }

      const todoType = context?.isVirtual ? "Virtual → Real" : "Real";
      console.log(
        `✅ Smart Toggle erfolgreich: ${todoType} "${variables.todo.title}"`
      );
    },
  });
}

/**
 * Bulk Smart Toggle Hook - Für mehrere Todos gleichzeitig
 * Nützlich für "Alle markieren" Features
 *
 * @returns useMutation Hook für Bulk Toggle Operations
 */
export function useSmartBulkToggle() {
  const smartToggle = useSmartToggle();

  return useMutation({
    mutationFn: async (todos: SmartTodo[]) => {
      const results = [];

      // Sequentiell verarbeiten um DB-Konflikte zu vermeiden
      for (const todo of todos) {
        try {
          const result = await smartToggle.mutateAsync({ todo });
          results.push(result);
        } catch (error) {
          console.error(`Bulk Toggle Fehler für "${todo.title}":`, error);
          // Weitermachen mit anderen Todos
        }
      }

      return results;
    },
  });
}

/**
 * Utility Hook: Smart Toggle für spezifisches Datum
 * Nützlich für Tages-spezifische Bulk-Operations
 */
export function useSmartToggleByDate() {
  const queryClient = useQueryClient();
  const smartToggle = useSmartToggle();

  return {
    toggleAllForDate: async (date: string, newStatus: boolean) => {
      const dateObj = dayjs(date);
      const queryKey = ["todos", dateObj.year(), dateObj.month()];

      // Hole alle Todos für das Datum aus dem Cache
      const todosInCache =
        queryClient.getQueryData<SmartTodo[]>(queryKey) || [];
      const todosForDate = todosInCache.filter((todo) => todo.date === date);

      console.log(`🔀 Bulk Toggle für ${date}: ${todosForDate.length} Todos`);

      // Toggle alle Todos für das Datum
      const promises = todosForDate.map((todo) =>
        smartToggle.mutateAsync({ todo, newStatus })
      );

      return Promise.allSettled(promises);
    },
  };
}
