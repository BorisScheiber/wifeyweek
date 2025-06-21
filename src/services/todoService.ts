import { supabase } from "../lib/supabaseClient";
import dayjs from "dayjs";

// Angepasster Typ inkl. date & time
export type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
  date?: string; // zB. "2025-06-15"
  time?: string; // zB. "15:30:00"
  recurring_id?: string; // Referenz auf recurring_todos.id
};

export type RecurringTodo = {
  id: string;
  title: string;
  start_date: string; // zB. "2025-06-21"
  time?: string | null;
  repeat_count: number;
  repeat_unit: "day" | "week" | "month"; // feste Auswahl
  is_active: boolean;
  end_date?: string | null; // optional, falls du das später nutzt
  created_at: string;
};

class TodoService {
  // Nur Todos für ein bestimmtes Datum (sortiert nach Zeit)
  async getByDate(date: string): Promise<Todo[]> {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("date", date)
      .order("time", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden nach Datum:", error.message);
      return [];
    }

    return data as Todo[];
  }

  // Alle Todos eines Monats laden (zB. für Tagesübersicht)
  async getByMonth(year: number, month: number): Promise<Todo[]> {
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const end = dayjs(start).endOf("month").format("YYYY-MM-DD");

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .gte("date", start)
      .lte("date", end);

    if (error) {
      console.error("Fehler beim Laden des Monats:", error.message);
      return [];
    }

    return data as Todo[];
  }

  // Einzelnes Todo laden
  async getSingle(id: string): Promise<Todo | null> {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Fehler beim Laden eines ToDos:", error.message);
      return null;
    }

    return data as Todo;
  }

  // Neues Todo erstellen (inkl. Datum + Uhrzeit)
  async add(todo: {
    title: string;
    date: string;
    time?: string | null;
    is_done?: boolean;
    recurring_id?: string;
  }): Promise<void> {
    const { error } = await supabase.from("todos").insert([
      {
        title: todo.title,
        date: todo.date,
        time: todo.time,
        is_done: todo.is_done ?? false,
        recurring_id: todo.recurring_id,
      },
    ]);

    if (error) {
      console.error("Fehler beim Einfügen:", error.message);
      throw error; // Fehler weiterwerfen für bessere Fehlerbehandlung
    }
  }

  // Wiederholende Aufgabe anlegen
  async addRecurringTodo(todo: {
    title: string;
    start_date: string;
    repeat_count: number;
    repeat_unit: "day" | "week" | "month";
    time?: string | null;
  }): Promise<void> {
    const { error } = await supabase.from("recurring_todos").insert([
      {
        title: todo.title,
        start_date: todo.start_date,
        time: todo.time || null,
        repeat_count: todo.repeat_count,
        repeat_unit: todo.repeat_unit,
        is_active: true,
      },
    ]);

    if (error) {
      console.error(
        "Fehler beim Anlegen einer Wiederholungsregel:",
        error.message
      );
      throw error;
    }
  }

  // Automatische Generierung von ToDos basierend auf recurring_todos
  async generateRecurringTodosForMonth(
    year: number,
    month: number
  ): Promise<void> {
    try {
      console.log(`Generiere recurring todos für ${year}-${month + 1}`);

      // Monatsanfang und -ende berechnen
      const monthStart = dayjs(
        `${year}-${String(month + 1).padStart(2, "0")}-01`
      );
      const monthEnd = monthStart.endOf("month");

      // Alle aktiven recurring_todos laden, die vor oder am Monatsende starten
      const { data: recurringTodos, error: recurringError } = await supabase
        .from("recurring_todos")
        .select("*")
        .eq("is_active", true)
        .lte("start_date", monthEnd.format("YYYY-MM-DD"));

      if (recurringError) {
        console.error(
          "Fehler beim Laden der recurring_todos:",
          recurringError.message
        );
        return;
      }

      if (!recurringTodos || recurringTodos.length === 0) {
        console.log("Keine aktiven recurring_todos gefunden");
        return;
      }

      console.log(`Gefunden: ${recurringTodos.length} recurring_todos`);

      // Sammle alle zu erstellenden Todos
      const todosToCreate: Array<{
        title: string;
        date: string;
        time: string | null;
        is_done: boolean;
        recurring_id: string;
      }> = [];

      // Für jeden recurring_todo die Termine im Zielmonat generieren
      for (const recurringTodo of recurringTodos) {
        const startDate = dayjs(recurringTodo.start_date);
        const generatedDates: string[] = [];

        // Berechne alle möglichen Termine im Zielmonat
        let currentDate = startDate;

        // Starte vom ersten möglichen Termin im Zielmonat
        while (currentDate.isBefore(monthStart)) {
          if (recurringTodo.repeat_unit === "day") {
            currentDate = currentDate.add(recurringTodo.repeat_count, "day");
          } else if (recurringTodo.repeat_unit === "week") {
            currentDate = currentDate.add(recurringTodo.repeat_count, "week");
          } else if (recurringTodo.repeat_unit === "month") {
            currentDate = currentDate.add(recurringTodo.repeat_count, "month");
          }
        }

        // Sammle alle Termine im Zielmonat
        while (currentDate.isBefore(monthEnd) || currentDate.isSame(monthEnd)) {
          if (
            currentDate.isAfter(monthStart) ||
            currentDate.isSame(monthStart)
          ) {
            generatedDates.push(currentDate.format("YYYY-MM-DD"));
          }

          // Nächster Termin berechnen
          if (recurringTodo.repeat_unit === "day") {
            currentDate = currentDate.add(recurringTodo.repeat_count, "day");
          } else if (recurringTodo.repeat_unit === "week") {
            currentDate = currentDate.add(recurringTodo.repeat_count, "week");
          } else if (recurringTodo.repeat_unit === "month") {
            currentDate = currentDate.add(recurringTodo.repeat_count, "month");
          }
        }

        console.log(
          `Recurring todo "${recurringTodo.title}": ${generatedDates.length} Termine generiert`
        );

        // Für jeden generierten Termin sammeln
        for (const date of generatedDates) {
          todosToCreate.push({
            title: recurringTodo.title,
            date: date,
            time: recurringTodo.time,
            is_done: false,
            recurring_id: recurringTodo.id,
          });
        }
      }

      if (todosToCreate.length === 0) {
        console.log("Keine Todos zu erstellen");
        return;
      }

      console.log(`${todosToCreate.length} Todos werden verarbeitet (upsert)`);

      // Upsert der Todos - Datenbank verhindert Duplikate
      const { error: upsertError } = await supabase
        .from("todos")
        .upsert(todosToCreate, {
          onConflict: "recurring_id,date",
          ignoreDuplicates: true,
        });

      if (upsertError) {
        console.error("Fehler beim Upsert:", upsertError.message);
        throw upsertError;
      }

      console.log(
        `${todosToCreate.length} recurring Todos verarbeitet (neue + bereits existierende)`
      );
    } catch (error) {
      console.error("Fehler beim Generieren der recurring Todos:", error);
      throw error;
    }
  }

  // Todo aktualisieren
  async update(id: string, fields: Partial<Todo>): Promise<void> {
    const { error } = await supabase.from("todos").update(fields).eq("id", id);

    if (error) {
      console.error("Fehler beim Aktualisieren:", error.message);
    }
  }

  // Status toggeln
  async toggle(id: string, is_done: boolean): Promise<void> {
    const { error } = await supabase
      .from("todos")
      .update({ is_done: !is_done })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Aktualisieren:", error.message);
    }
  }

  // Löschen
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) {
      console.error("Fehler beim Löschen:", error.message);
    }
  }
}

export const todoService = new TodoService();
