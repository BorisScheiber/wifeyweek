import { LucidePlus, Check } from "lucide-react";
import { useState } from "react";

export default function TodoPage() {
  const [currentMonth, setCurrentMonth] = useState("Juni 2025");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [todos, setTodos] = useState([
    {
      title: "Besteck aussortieren",
      note: "Ordnungsprojekt: Besteckschublade",
      done: false,
    },
    {
      title: "Badregal putzen",
      note: "Routine: Badezimmer",
      done: true,
    },
    {
      title: "Socken sortieren",
      note: "Ordnungsprojekt: Kleiderschrank",
      done: false,
    },
  ]);

  const days = [
    { day: "FR", date: "21", done: 2, total: 6 },
    { day: "SA", date: "22", done: 3, total: 5 },
    { day: "SO", date: "23", done: 1, total: 4 },
    { day: "MO", date: "24", done: 2, total: 5 },
    { day: "DI", date: "25", done: 0, total: 3 },
    { day: "MI", date: "26", done: 4, total: 5 },
    { day: "DO", date: "27", done: 2, total: 2 },
    { day: "FR", date: "28", done: 4, total: 8 },
  ];

  const toggleDone = (index: number) => {
    const updatedTodos = [...todos];
    updatedTodos[index].done = !updatedTodos[index].done;
    setTodos(updatedTodos);
  };

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
              <span
                className={`absolute bottom-[-10px] px-2 py-[2px] text-[11px] rounded-full border shadow-sm bg-white
                  text-[#8d8577]`}
              >
                {day.done}/{day.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Aufgabenliste */}
      <div className="mt-4 px-4 space-y-3 pb-12">
        {todos.map((todo, i) => (
          <div
            key={i}
            className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-start gap-3"
          >
            {/* Interaktive Checkbox */}
            <button
              onClick={() => toggleDone(i)}
              className={`w-5 h-5 mt-1 flex items-center justify-center rounded-full border-2 
                ${
                  todo.done
                    ? "bg-[#855B31] border-[#855B31] text-white"
                    : "border-[#855B31]"
                }`}
            >
              {todo.done && <Check size={14} strokeWidth={3} />}
            </button>

            {/* Text */}
            <div>
              <div className="font-medium text-stone-800">{todo.title}</div>
              <div className="text-sm text-stone-400">{todo.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
