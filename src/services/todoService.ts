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
  }): Promise<void> {
    const { error } = await supabase.from("todos").insert([
      {
        title: todo.title,
        date: todo.date,
        time: todo.time,
        is_done: todo.is_done ?? false,
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
