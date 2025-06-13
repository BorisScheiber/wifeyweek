import { useEffect, useState } from "react";
import { todoService } from "../services/todoService";
import type { Todo } from "../services/todoService";

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    loadTodos();
  }, []);

  async function loadTodos() {
    const data = await todoService.getAll();
    setTodos(data);
  }

  async function handleAddTodo() {
    if (!newTitle.trim()) return;
    await todoService.add(newTitle);
    setNewTitle("");
    loadTodos();
  }

  async function handleToggle(todo: Todo) {
    await todoService.toggle(todo.id, todo.is_done);
    loadTodos();
  }

  async function handleDelete(id: string) {
    await todoService.delete(id);
    loadTodos();
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-stone-50 shadow rounded-xl border border-stone-200">
  <h1 className="text-2xl font-semibold mb-4 text-center text-stone-800">
    Wifey’s Woche 🌿
  </h1>

  <div className="flex gap-2 mb-6">
    <input
      type="text"
      value={newTitle}
      onChange={(e) => setNewTitle(e.target.value)}
      placeholder="Neue Aufgabe eingeben"
      className="flex-1 px-4 py-2 border border-stone-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
    />
    <button
      onClick={handleAddTodo}
      className="bg-amber-400 text-white px-4 py-2 rounded hover:bg-amber-500 transition-colors"
    >
      Hinzufügen
    </button>
  </div>

  <ul className="space-y-3">
    {todos.map((todo) => (
      <li
        key={todo.id}
        className={`flex items-center justify-between px-4 py-2 rounded border ${
          todo.is_done
            ? 'bg-emerald-100 line-through text-stone-500'
            : 'bg-white text-stone-800'
        }`}
      >
        <span
          onClick={() => handleToggle(todo)}
          className="cursor-pointer flex-1"
        >
          {todo.title}
        </span>
        <button
          onClick={() => handleDelete(todo.id)}
          className="ml-2 text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      </li>
    ))}
  </ul>
</div>

  );
}
