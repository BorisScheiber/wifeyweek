import { supabase } from "../lib/supabaseClient";

// Angepasster Typ inkl. date & time
export type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
  date?: string; // z. B. "2025-06-15"
  time?: string; // z. B. "15:30:00"
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
