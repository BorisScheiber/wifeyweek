import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTodoMutations } from "../hooks/useTodoMutations";
import dayjs from "dayjs";

import { LucideX, LucideCheck } from "lucide-react";
import TitleField from "../components/TitleField";
import DateField from "../components/DateField";
import TimeField from "../components/TimeField";
import RepeatField from "../components/RepeatField";

// Dayjs Locale Import - WICHTIG!
import "dayjs/locale/de";

export default function CreateTodoPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [repeatCount, setRepeatCount] = useState<number | null>(null);
  const [repeatUnit, setRepeatUnit] = useState<string>("");
  const [error, setError] = useState("");
  const [repeatError, setRepeatError] = useState("");

  // Mutations für optimistic updates
  const { addTodo, addRecurringTodo } = useTodoMutations();

  // Loading state from mutations
  const isLoading = addTodo.isPending || addRecurringTodo.isPending;

  // Aktiviere deutsche Lokalisierung für dayjs
  dayjs.locale("de");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setError("");
    setRepeatError("");

    if (!title.trim()) {
      setError("Bitte geben Sie einen Titel ein");
      return;
    }

    // Prüfe Wiederholungsfelder
    if ((repeatCount && !repeatUnit) || (!repeatCount && repeatUnit)) {
      setRepeatError("Bitte beide Felder für Wiederholung auswählen");
      return;
    }

    try {
      if (repeatCount && repeatUnit) {
        // Wiederholende Aufgabe anlegen mit optimistic update
        addRecurringTodo.mutate(
          {
            title: title.trim(),
            start_date: date,
            repeat_count: repeatCount,
            repeat_unit: repeatUnit as "day" | "week" | "month",
            time: time || null,
          },
          {
            onSuccess: () => {
              navigate(-1); // Zurück zur vorherigen Seite
            },
            onError: () => {
              setError("Fehler beim Speichern der wiederkehrenden Aufgabe");
            },
          }
        );
      } else {
        // Normales Todo anlegen mit optimistic update
        addTodo.mutate(
          {
            title: title.trim(),
            time: time || null,
            date: date,
            is_done: false,
          },
          {
            onSuccess: () => {
              navigate(-1); // Zurück zur vorherigen Seite
            },
            onError: () => {
              setError("Fehler beim Speichern der Aufgabe");
            },
          }
        );
      }
    } catch (err) {
      setError("Unerwarteter Fehler");
      console.error("Error in handleSubmit:", err);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#faf4ef] px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl  text-[#855B31] mb-8 text-center">
          Aufgabe hinzufügen
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" id="todo-form">
          {/* Titel-Eingabe */}
          <TitleField
            value={title}
            onChange={setTitle}
            error={error}
            disabled={isLoading}
            onErrorChange={setError}
          />

          {/* Datum-Eingabe mit MUI DatePicker */}
          <DateField value={date} onChange={setDate} disabled={isLoading} />

          {/* MUI TimePicker mit Custom Styling */}
          <TimeField value={time} onChange={setTime} disabled={isLoading} />

          {/* Wiederholungsfeld */}
          <RepeatField
            repeatCount={repeatCount}
            setRepeatCount={setRepeatCount}
            repeatUnit={repeatUnit}
            setRepeatUnit={setRepeatUnit}
            error={repeatError}
            disabled={isLoading}
            onErrorChange={setRepeatError}
          />
        </form>

        {/* Floating Action Buttons */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="fixed bottom-4 left-4 w-14 h-14 bg-[#fdf6ef] border-2 border-[#855B31] text-[#855B31] rounded-full shadow-md z-40 flex items-center justify-center hover:bg-[#f1dec9] transition-all disabled:opacity-50"
        >
          <LucideX size={24} />
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isLoading && title.trim()) {
              const form = document.getElementById(
                "todo-form"
              ) as HTMLFormElement;
              if (form) {
                form.dispatchEvent(
                  new Event("submit", { bubbles: true, cancelable: true })
                );
              }
            }
          }}
          disabled={isLoading || !title.trim()}
          className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-[#a67c52] text-white rounded-full shadow-lg z-40 flex items-center justify-center hover:from-[#a67c52] hover:to-[#9b6f47] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LucideCheck size={24} />
        </button>
      </div>
    </div>
  );
}
