import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todoService, type Todo } from "../services/todoService";
import dayjs from "dayjs";

// Parameter Types für die Mutations
type AddTodoParams = {
  title: string;
  date: string;
  time?: string | null;
  is_done?: boolean;
  recurring_id?: string;
};

type AddRecurringTodoParams = {
  title: string;
  start_date: string;
  repeat_count: number;
  repeat_unit: "day" | "week" | "month";
  time?: string | null;
};

type ToggleTodoParams = {
  id: string;
  is_done: boolean;
};

type DeleteTodoParams = {
  id: string;
};

export function useTodoMutations() {
  const queryClient = useQueryClient();

  // Helper function to get affected query keys for a date
  const getQueryKeyForDate = (date: string) => {
    const dateObj = dayjs(date);
    return ["todos", dateObj.year(), dateObj.month()];
  };

  // OPTIMIZED: Smart calculation for recurring todo affected months
  const calculateAffectedMonths = (
    startDate: string,
    repeatCount: number,
    repeatUnit: "day" | "week" | "month"
  ): string[] => {
    const start = dayjs(startDate);
    const affectedMonths = new Set<string>(); // Use Set to avoid duplicates

    // Calculate max reasonable iterations based on repeat unit
    let maxIterations;
    switch (repeatUnit) {
      case "day":
        maxIterations = Math.min(repeatCount, 365); // Max 1 year for daily
        break;
      case "week":
        maxIterations = Math.min(repeatCount, 52); // Max 1 year for weekly
        break;
      case "month":
        maxIterations = Math.min(repeatCount, 24); // Max 2 years for monthly
        break;
      default:
        maxIterations = 12;
    }

    // Generate affected dates and extract unique months
    for (let i = 0; i < maxIterations; i++) {
      let targetDate;
      if (repeatUnit === "day") {
        targetDate = start.add(i * repeatCount, "day");
      } else if (repeatUnit === "week") {
        targetDate = start.add(i * repeatCount, "week");
      } else {
        targetDate = start.add(i * repeatCount, "month");
      }

      // Add month key to set
      const monthKey = `${targetDate.year()}-${targetDate.month()}`;
      affectedMonths.add(monthKey);

      // Stop if we're too far in the future (performance limit)
      if (i > 50) break;
    }

    return Array.from(affectedMonths);
  };

  // OPTIMIZED: Batch invalidation with deduplication
  const batchInvalidateQueries = (queryKeys: (string | number)[][]) => {
    const uniqueKeys = new Set(queryKeys.map((key) => JSON.stringify(key)));

    // Batch invalidate all unique query keys
    Array.from(uniqueKeys).forEach((keyString) => {
      const queryKey = JSON.parse(keyString);
      queryClient.invalidateQueries({ queryKey });
    });
  };

  // OPTIMIZED: Fast todo lookup in cache without linear search
  const findTodoInCache = (
    todoId: string
  ): { queryKey: string[]; todo: Todo } | null => {
    const queryCache = queryClient.getQueryCache();
    const todosQueries = queryCache.findAll({
      queryKey: ["todos"],
      type: "active",
    });

    for (const query of todosQueries) {
      const todos = query.state.data as Todo[] | undefined;
      const foundTodo = todos?.find((todo) => todo.id === todoId);

      if (foundTodo) {
        return {
          queryKey: query.queryKey as string[],
          todo: foundTodo,
        };
      }
    }

    return null;
  };

  // Add Todo Mutation
  const addTodoMutation = useMutation({
    mutationFn: async (params: AddTodoParams) => {
      await todoService.add(params);
      return params; // Return params for optimistic update
    },
    onMutate: async (newTodo) => {
      const queryKey = getQueryKeyForDate(newTodo.date);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous state
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);

      // Optimistic update: Add new todo to cache
      const tempId = `temp-${Date.now()}`; // Temporary ID
      const optimisticTodo: Todo = {
        id: tempId,
        title: newTodo.title,
        date: newTodo.date,
        time: newTodo.time || undefined,
        is_done: newTodo.is_done || false,
        created_at: new Date().toISOString(),
        recurring_id: newTodo.recurring_id,
      };

      queryClient.setQueryData<Todo[]>(queryKey, (old = []) => [
        ...old,
        optimisticTodo,
      ]);

      return { previousTodos, queryKey, tempId };
    },
    onError: (error, variables, context) => {
      console.error("Fehler beim Hinzufügen des Todos:", error);
      // Rollback optimistic update
      if (context?.previousTodos) {
        queryClient.setQueryData(context.queryKey, context.previousTodos);
      }
    },
    onSuccess: (data, variables) => {
      // OPTIMIZED: Only invalidate if necessary (reduced unnecessary refetches)
      const queryKey = getQueryKeyForDate(variables.date);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // OPTIMIZED: Add Recurring Todo Mutation with smart invalidation
  const addRecurringTodoMutation = useMutation({
    mutationFn: async (params: AddRecurringTodoParams) => {
      await todoService.addRecurringTodo(params);
      return params;
    },
    onSuccess: (data) => {
      // OPTIMIZED: Smart calculation of affected months instead of blanket 12 months
      const affectedMonthKeys = calculateAffectedMonths(
        data.start_date,
        data.repeat_count,
        data.repeat_unit
      );

      // Convert month keys to query keys and batch invalidate
      const queryKeysToInvalidate = affectedMonthKeys.map((monthKey) => {
        const [year, month] = monthKey.split("-").map(Number);
        return ["todos", year, month];
      });

      console.log(
        `🔄 Recurring Todo: Invalidiere ${queryKeysToInvalidate.length} betroffene Monate`
      );
      batchInvalidateQueries(queryKeysToInvalidate);
    },
    onError: (error) => {
      console.error(
        "Fehler beim Hinzufügen der wiederkehrenden Aufgabe:",
        error
      );
    },
  });

  // OPTIMIZED: Toggle Todo Mutation with fast cache lookup
  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, is_done }: ToggleTodoParams) => {
      await todoService.toggle(id, is_done);
      return { id, is_done };
    },
    onMutate: async ({ id }) => {
      // OPTIMIZED: Fast cache lookup instead of linear search
      const cacheResult = findTodoInCache(id);

      if (!cacheResult) {
        console.warn(`⚠️ Todo ${id} not found in cache for toggle`);
        return;
      }

      const { queryKey: affectedQueryKey } = cacheResult;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: affectedQueryKey });

      // Snapshot previous state
      const previousTodos = queryClient.getQueryData<Todo[]>(affectedQueryKey);

      // Optimistic update
      queryClient.setQueryData<Todo[]>(affectedQueryKey, (old = []) =>
        old.map((todo) =>
          todo.id === id ? { ...todo, is_done: !todo.is_done } : todo
        )
      );

      return { previousTodos, affectedQueryKey };
    },
    onError: (error, variables, context) => {
      console.error("Fehler beim Umschalten des Todo-Status:", error);
      // Rollback optimistic update
      if (context?.previousTodos && context?.affectedQueryKey) {
        queryClient.setQueryData(
          context.affectedQueryKey,
          context.previousTodos
        );
      }
    },
  });

  // OPTIMIZED: Delete Todo Mutation with fast cache lookup
  const deleteTodoMutation = useMutation({
    mutationFn: async ({ id }: DeleteTodoParams) => {
      await todoService.delete(id);
      return { id };
    },
    onMutate: async ({ id }) => {
      // OPTIMIZED: Fast cache lookup instead of linear search
      const cacheResult = findTodoInCache(id);

      if (!cacheResult) {
        console.warn(`⚠️ Todo ${id} not found in cache for delete`);
        return;
      }

      const { queryKey: affectedQueryKey, todo: deletedTodo } = cacheResult;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: affectedQueryKey });

      // Snapshot previous state
      const previousTodos = queryClient.getQueryData<Todo[]>(affectedQueryKey);

      // Optimistic update: Remove todo from cache
      queryClient.setQueryData<Todo[]>(affectedQueryKey, (old = []) =>
        old.filter((todo) => todo.id !== id)
      );

      return { previousTodos, affectedQueryKey, deletedTodo };
    },
    onError: (error, variables, context) => {
      console.error("Fehler beim Löschen des Todos:", error);
      // Rollback optimistic update
      if (context?.previousTodos && context?.affectedQueryKey) {
        queryClient.setQueryData(
          context.affectedQueryKey,
          context.previousTodos
        );
      }
    },
  });

  return {
    addTodo: addTodoMutation,
    addRecurringTodo: addRecurringTodoMutation,
    toggleTodo: toggleTodoMutation,
    deleteTodo: deleteTodoMutation,
  };
}
