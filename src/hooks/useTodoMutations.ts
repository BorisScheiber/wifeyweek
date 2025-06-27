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

  // Helper function to invalidate multiple months (for recurring todos)
  const invalidateAffectedMonths = (dates: string[]) => {
    const queryKeys = dates.map(getQueryKeyForDate);
    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
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
    onSuccess: (data, variables, context) => {
      // Invalidate to get the real data from server (with correct ID)
      const queryKey = getQueryKeyForDate(variables.date);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Add Recurring Todo Mutation
  const addRecurringTodoMutation = useMutation({
    mutationFn: async (params: AddRecurringTodoParams) => {
      await todoService.addRecurringTodo(params);
      return params;
    },
    onSuccess: (data) => {
      // For recurring todos, we need to invalidate multiple months
      // For simplicity, let's invalidate the start month and a few months after
      const startDate = dayjs(data.start_date);
      const monthsToInvalidate = [];

      for (let i = 0; i < 12; i++) {
        // Invalidate next 12 months
        const targetMonth = startDate.add(i, "month");
        monthsToInvalidate.push(targetMonth.format("YYYY-MM-DD"));
      }

      invalidateAffectedMonths(monthsToInvalidate);
    },
    onError: (error) => {
      console.error(
        "Fehler beim Hinzufügen der wiederkehrenden Aufgabe:",
        error
      );
    },
  });

  // Toggle Todo Mutation
  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, is_done }: ToggleTodoParams) => {
      await todoService.toggle(id, is_done);
      return { id, is_done };
    },
    onMutate: async ({ id }) => {
      // Find the todo to determine which month to update
      let affectedQueryKey: string[] | null = null;
      let previousTodos: Todo[] | undefined;

      // Find the query key that contains this todo
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ["todos"] });

      for (const query of queries) {
        const todos = query.state.data as Todo[] | undefined;
        if (todos?.some((todo) => todo.id === id)) {
          affectedQueryKey = query.queryKey as string[];
          break;
        }
      }

      if (!affectedQueryKey) return;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: affectedQueryKey });

      // Snapshot previous state
      previousTodos = queryClient.getQueryData<Todo[]>(affectedQueryKey);

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

  // Delete Todo Mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async ({ id }: DeleteTodoParams) => {
      await todoService.delete(id);
      return { id };
    },
    onMutate: async ({ id }) => {
      // Find the todo to determine which month to update
      let affectedQueryKey: string[] | null = null;
      let previousTodos: Todo[] | undefined;
      let deletedTodo: Todo | undefined;

      // Find the query key that contains this todo
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.findAll({ queryKey: ["todos"] });

      for (const query of queries) {
        const todos = query.state.data as Todo[] | undefined;
        deletedTodo = todos?.find((todo) => todo.id === id);
        if (deletedTodo) {
          affectedQueryKey = query.queryKey as string[];
          break;
        }
      }

      if (!affectedQueryKey) return;

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: affectedQueryKey });

      // Snapshot previous state
      previousTodos = queryClient.getQueryData<Todo[]>(affectedQueryKey);

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
