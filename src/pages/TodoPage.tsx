import { LucidePlus, Check, Clock } from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { todoService, type Todo } from "../services/todoService";
import dayjs from "dayjs";

export default function TodoPage() {
  // 📅 Heute + aktueller Monat
  const now = dayjs();
  const year = now.year();
  const month = now.month(); // 0-basiert: Juni = 5

  // 🧠 Tage dynamisch erzeugen
  const dayNames = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
  const totalDays = dayjs(`${year}-${month + 1}-01`).daysInMonth();

  // Basis-Tage ohne Statistiken
  const baseDays = Array.from({ length: totalDays }, (_, i) => {
    const date = dayjs(`${year}-${month + 1}-${i + 1}`);
    return {
      day: dayNames[date.day()],
      date: date.format("DD"),
      fullDate: date.format("YYYY-MM-DD"),
      done: 0,
      total: 0,
    };
  });

  // 📍 Heute als vorausgewählten Tag setzen
  const initialSelectedIndex = now.date() - 1;
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentMonth, setCurrentMonth] = useState(now.format("MMMM YYYY")); // z. B. "Juni 2025"
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasScrolledInitially = useRef(false);

  // Berechne Statistiken für jeden Tag
  const days = useMemo(() => {
    return baseDays.map((day) => {
      const dayTodos = todos.filter((todo) => todo.date === day.fullDate);
      return {
        ...day,
        total: dayTodos.length,
        done: dayTodos.filter((todo) => todo.is_done).length,
      };
    });
  }, [todos, baseDays]);

  const currentDate = dayjs()
    .year(year)
    .month(month)
    .date(Number(days[selectedIndex].date))
    .format("YYYY-MM-DD");

  // Todos für den Tag laden
  useEffect(() => {
    async function fetchTodos() {
      const data = await todoService.getByDate(currentDate);
      setTodos(data);
    }

    fetchTodos();
  }, [currentDate]);

  // Scroll zum ausgewählten Tag
  useEffect(() => {
    const selectedRef = dayRefs.current[selectedIndex];
    if (selectedRef) {
      // Initiales Scrollen ohne Animation
      if (!hasScrolledInitially.current) {
        selectedRef.scrollIntoView({ behavior: "auto", inline: "center" });
        hasScrolledInitially.current = true;
      } else {
        // Interaktives Scrollen mit Animation
        selectedRef.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [selectedIndex]);

  // Checkbox-Toggle
  async function toggleDone(index: number) {
    const todo = todos[index];
    await todoService.toggle(todo.id, todo.is_done);
    const updated = await todoService.getByDate(currentDate);
    setTodos(updated);
  }

  return (
    <div className="pt-[80px]">
      {/* Fixierter Header */}
      <header className="fixed top-0 left-0 right-0 h-[80px] bg-[var(--color-primary)] text-white shadow-md z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="w-6"></div>
          <button
            onClick={() => alert("Monatsauswahl kommt später 😄")}
            className="text-lg font-semibold tracking-wide"
          >
            {currentMonth}
          </button>
          <button
            onClick={() => alert("Neue Aufgabe hinzufügen kommt später 😊")}
            className="text-white hover:text-[var(--color-plus-hover)] transition-colors"
          >
            <LucidePlus size={24} />
          </button>
        </div>
      </header>

      {/* Horizontale Tagesübersicht */}
      <div className="overflow-x-auto whitespace-nowrap px-4 py-3 flex gap-3 bg-[#faf4ef] scrollbar-hide">
        {days.map((day, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={index}
              ref={(el) => {
                dayRefs.current[index] = el;
              }}
              onClick={() => setSelectedIndex(index)}
              className={`relative min-w-[60px] h-[90px] shrink-0 rounded-xl px-2 py-2 flex flex-col items-center justify-center
                transition-colors duration-200
                ${
                  isSelected
                    ? "bg-[#B48D62] text-white"
                    : "bg-[#f1dec9] text-stone-800"
                }`}
            >
              <span className="text-xs">{day.day}</span>
              <span className="text-xl font-semibold leading-none">
                {day.date}
              </span>

              {/* Fortschritts-Badge */}
              {day.total > 0 && (
                <span className="absolute bottom-[-10px] px-2 py-[2px] text-[11px] rounded-full border shadow-sm bg-white text-[#8d8577]">
                  {day.done}/{day.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Aufgabenliste */}
      <div className="mt-4 px-4 space-y-3 pb-12">
        {todos.map((todo, i) => (
          <div
            key={todo.id}
            className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-start gap-3"
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleDone(i)}
              className={`w-5 h-5 mt-1 flex items-center justify-center rounded-full border-2 
                ${
                  todo.is_done
                    ? "bg-[#855B31] border-[#855B31] text-white"
                    : "border-[#855B31]"
                }`}
            >
              {todo.is_done && <Check size={14} strokeWidth={3} />}
            </button>

            {/* Titel + Uhrzeit */}
            <div>
              <div className="font-medium text-stone-800">{todo.title}</div>
              {todo.time && (
                <div className="text-sm text-stone-500 flex items-center gap-1 mt-0.5">
                  <Clock size={16} strokeWidth={2} />
                  <span>{todo.time.slice(0, 5)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
