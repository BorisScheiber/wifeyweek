import { supabase } from "../lib/supabaseClient";

export type Todo = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};

class TodoService {
  // Get all todo items
  async getAll(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Fehler beim Laden:", error.message);
      return [];
    }

    return data as Todo[];
  }

  // Get a single todo item
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

  // Add a new todo item
  async add(title: string): Promise<void> {
    const { error } = await supabase.from("todos").insert([{ title }]);
    if (error) console.error("Fehler beim Einfügen:", error.message);
  }

  // Update a todo item
  async update(id: string, fields: Partial<Todo>): Promise<void> {
    const { error } = await supabase.from("todos").update(fields).eq("id", id);

    if (error) {
      console.error("Fehler beim Aktualisieren:", error.message);
    }
  }

  // Toggle the is_done field
  async toggle(id: string, is_done: boolean): Promise<void> {
    const { error } = await supabase
      .from("todos")
      .update({ is_done: !is_done })
      .eq("id", id);

    if (error) console.error("Fehler beim Aktualisieren:", error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("todos").delete().eq("id", id);

    if (error) console.error("Fehler beim Löschen:", error.message);
  }
}

export const todoService = new TodoService();
