import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { todoService, type Todo } from "../services/todoService";
import {
  type SmartTodo,
  isVirtualTodo,
  isRealTodo,
} from "../types/virtualTodo";

// Parameter Types für Smart Delete
type SmartDeleteParams = {
  todo: SmartTodo;
};

/**
 * Smart Delete Hook - Handelt Real und Virtual Todos intelligent
 * Virtual Todos: Nur aus Cache entfernen (kein DB-Call)
 * Real Todos: DB delete via todoService.delete()
 *
 * @returns useMutation Hook für Smart Delete Operations
 */
export function useSmartDelete() {
  const queryClient = useQueryClient();

  // Helper: Query Key für ein bestimmtes Datum berechnen
  const getQueryKeyForDate = (date: string) => {
    const dateObj = dayjs(date);
    return ["todos", dateObj.year(), dateObj.month()];
  };

  return useMutation({
    mutationFn: async ({ todo }: SmartDeleteParams) => {
      if (isVirtualTodo(todo)) {
        // Virtual Todo → Kein DB-Call nötig, nur Cache-Entfernung
        console.log(`🗑️ Virtual Todo Delete: ${todo.title} (nur Cache)`);

        // Virtual Todos existieren nur im Cache, daher return void
        return Promise.resolve();
      } else if (isRealTodo(todo)) {
        // Real Todo → DB Delete via todoService
        console.log(`🗑️ Real Todo Delete: ${todo.title} (DB + Cache)`);
        await todoService.delete(todo.id);

        // Return deleted todo for consistency
        return todo;
      } else {
        throw new Error("Unbekannter Todo-Typ für Smart Delete");
      }
    },

    onMutate: async ({ todo }) => {
      const affectedQueryKey = getQueryKeyForDate(todo.date!);

      // Cancel outgoing queries für den betroffenen Monat
      await queryClient.cancelQueries({ queryKey: affectedQueryKey });

      // Snapshot previous state
      const previousTodos = queryClient.getQueryData<Todo[]>(affectedQueryKey);

      // Optimistic Update: Entferne Todo aus Cache (für beide Typen gleich)
      queryClient.setQueryData<Todo[]>(affectedQueryKey, (old = []) =>
        old.filter((t) => t.id !== todo.id)
      );

      const todoType = isVirtualTodo(todo) ? "Virtual" : "Real";
      console.log(`🔮 Optimistic: ${todoType} Todo "${todo.title}" entfernt`);

      return {
        previousTodos,
        affectedQueryKey,
        isVirtual: isVirtualTodo(todo),
        todo,
      };
    },

    onError: (error, variables, context) => {
      console.error("❌ Smart Delete Fehler:", error);

      // Rollback optimistic update
      if (context?.previousTodos && context?.affectedQueryKey) {
        queryClient.setQueryData(
          context.affectedQueryKey,
          context.previousTodos
        );

        const todoType = context.isVirtual ? "Virtual" : "Real";
        console.log(
          `🔄 Rollback: ${todoType} Todo "${context.todo.title}" wiederhergestellt`
        );
      }
    },

    onSuccess: (result, variables, context) => {
      // Invalidate nur den betroffenen Monat für fresh data
      if (context?.affectedQueryKey) {
        queryClient.invalidateQueries({ queryKey: context.affectedQueryKey });

        // Bei Virtual Todo Delete: Invalidate auch Virtual Todo Caches
        if (context.isVirtual) {
          queryClient.invalidateQueries({ queryKey: ["virtual-todos"] });
          console.log("🧙‍♂️ Virtual Todo Cache invalidiert nach Delete");
        }
      }

      const todoType = context?.isVirtual ? "Virtual" : "Real";
      console.log(
        `✅ Smart Delete erfolgreich: ${todoType} Todo "${variables.todo.title}" gelöscht`
      );
    },
  });
}

/**
 * Bulk Smart Delete Hook - Löscht mehrere Todos auf einmal
 * Separiert automatisch Virtual und Real Todos für optimale Performance
 *
 * @returns useMutation Hook für Bulk Delete Operations
 */
export function useSmartBulkDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ todos }: { todos: SmartTodo[] }) => {
      // Separiere Virtual und Real Todos
      const virtualTodos = todos.filter(isVirtualTodo);
      const realTodos = todos.filter(isRealTodo);

      console.log(
        `🗑️ Bulk Delete: ${virtualTodos.length} Virtual + ${realTodos.length} Real Todos`
      );

      // Real Todos: Parallel DB deletes
      if (realTodos.length > 0) {
        const deletePromises = realTodos.map((todo) =>
          todoService.delete(todo.id)
        );
        await Promise.all(deletePromises);
      }

      // Virtual Todos: Nur Log (werden über optimistic update entfernt)
      if (virtualTodos.length > 0) {
        console.log(
          `🧙‍♂️ ${virtualTodos.length} Virtual Todos werden nur aus Cache entfernt`
        );
      }

      return {
        deletedVirtual: virtualTodos.length,
        deletedReal: realTodos.length,
      };
    },

    onMutate: async ({ todos }) => {
      // Sammle alle betroffenen Query Keys
      const affectedQueryKeys = new Set<string>();
      const previousStates = new Map<string, Todo[]>();

      for (const todo of todos) {
        const queryKey = getQueryKeyForDate(todo.date!);
        const queryKeyString = JSON.stringify(queryKey);

        affectedQueryKeys.add(queryKeyString);

        // Cancel queries und snapshot state
        await queryClient.cancelQueries({ queryKey });

        if (!previousStates.has(queryKeyString)) {
          const previous = queryClient.getQueryData<Todo[]>(queryKey);
          if (previous) {
            previousStates.set(queryKeyString, previous);
          }
        }
      }

      // Optimistic Updates: Entferne alle Todos aus ihren jeweiligen Caches
      const todoIdsToDelete = new Set(todos.map((t) => t.id));

      for (const queryKeyString of affectedQueryKeys) {
        const queryKey = JSON.parse(queryKeyString);

        queryClient.setQueryData<Todo[]>(queryKey, (old = []) =>
          old.filter((t) => !todoIdsToDelete.has(t.id))
        );
      }

      const virtualCount = todos.filter(isVirtualTodo).length;
      const realCount = todos.filter(isRealTodo).length;

      console.log(
        `🔮 Optimistic Bulk Delete: ${virtualCount} Virtual + ${realCount} Real Todos entfernt`
      );

      return {
        previousStates,
        affectedQueryKeys,
        virtualCount,
        realCount,
        todos,
      };
    },

    onError: (error, variables, context) => {
      console.error("❌ Smart Bulk Delete Fehler:", error);

      // Rollback all optimistic updates
      if (context?.previousStates && context?.affectedQueryKeys) {
        for (const queryKeyString of context.affectedQueryKeys) {
          const queryKey = JSON.parse(queryKeyString);
          const previousState = context.previousStates.get(queryKeyString);

          if (previousState) {
            queryClient.setQueryData(queryKey, previousState);
          }
        }

        console.log(
          `🔄 Rollback: ${context.todos.length} Todos wiederhergestellt`
        );
      }
    },

    onSuccess: (result, variables, context) => {
      // Invalidate alle betroffenen Query Keys
      if (context?.affectedQueryKeys) {
        for (const queryKeyString of context.affectedQueryKeys) {
          const queryKey = JSON.parse(queryKeyString);
          queryClient.invalidateQueries({ queryKey });
        }

        // Bei Virtual Todos: Invalidate auch Virtual Todo Caches
        if (context.virtualCount > 0) {
          queryClient.invalidateQueries({ queryKey: ["virtual-todos"] });
          console.log("🧙‍♂️ Virtual Todo Cache invalidiert nach Bulk Delete");
        }
      }

      console.log(
        `✅ Smart Bulk Delete erfolgreich: ${result.deletedVirtual} Virtual + ${result.deletedReal} Real Todos gelöscht`
      );
    },
  });

  // Helper function für Query Key Generation
  function getQueryKeyForDate(date: string) {
    const dateObj = dayjs(date);
    return ["todos", dateObj.year(), dateObj.month()];
  }
}

/**
 * Smart Delete By Date Hook - Löscht alle Todos an einem bestimmten Datum
 * Nützlich für "Alle Todos heute löschen" Features
 *
 * @returns useMutation Hook für Date-basierte Delete Operations
 */
export function useSmartDeleteByDate() {
  const queryClient = useQueryClient();
  const { mutateAsync: bulkDelete } = useSmartBulkDelete();

  return useMutation({
    mutationFn: async ({ date }: { date: string }) => {
      const dateObj = dayjs(date);
      const queryKey = ["todos", dateObj.year(), dateObj.month()];

      // Alle Todos für das Datum aus dem Cache holen
      const allTodos = queryClient.getQueryData<Todo[]>(queryKey) || [];
      const todosForDate = allTodos.filter((todo) => todo.date === date);

      if (todosForDate.length === 0) {
        console.log(`📅 Keine Todos gefunden für ${date}`);
        return { deletedCount: 0 };
      }

      console.log(`📅 Lösche ${todosForDate.length} Todos für ${date}`);

      // Verwende Bulk Delete für die eigentliche Löschung
      await bulkDelete({ todos: todosForDate });

      return { deletedCount: todosForDate.length };
    },
  });
}
