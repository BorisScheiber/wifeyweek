import {
  LucidePlus,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { todoService, type Todo } from "../services/todoService";
import dayjs from "dayjs";

export default function TodoPage() {
  const navigate = useNavigate();

  const now = dayjs();
  const [month, setMonth] = useState(now.month());
  const [year, setYear] = useState(now.year());
  const [showMonthModal, setShowMonthModal] = useState(false);

  const monthLabels = [
    "Jänner",
    "Februar",
    "März",
    "April",
    "Mai",
    "Juni",
    "Juli",
    "August",
    "September",
    "Oktober",
    "November",
    "Dezember",
  ];
  const monthShort = [
    "Jän",
    "Feb",
    "Mär",
    "Apr",
    "Mai",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dez",
  ];

  const dayNames = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
  const totalDays = dayjs(`${year}-${month + 1}-01`).daysInMonth();

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

  const today = dayjs();
  const isCurrentMonth = today.year() === year && today.month() === month;
  const initialSelectedIndex = isCurrentMonth ? today.date() - 1 : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [todos, setTodos] = useState<Todo[]>([]);
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasScrolledInitially = useRef(false);

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

  useEffect(() => {
    async function fetchTodosForMonth() {
      const data = await todoService.getByMonth(year, month);
      setTodos(data);
    }

    fetchTodosForMonth();
  }, [year, month]);

  useEffect(() => {
    const selectedRef = dayRefs.current[selectedIndex];
    if (selectedRef) {
      if (!hasScrolledInitially.current) {
        selectedRef.scrollIntoView({ behavior: "auto", inline: "center" });
        hasScrolledInitially.current = true;
      } else {
        selectedRef.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [selectedIndex]);

  async function toggleDone(id: string, is_done: boolean) {
    await todoService.toggle(id, is_done);
    const updated = await todoService.getByMonth(year, month);
    setTodos(updated);
  }

  async function deleteTodo(id: string) {
    await todoService.delete(id);
    const updated = await todoService.getByMonth(year, month);
    setTodos(updated);
  }

  const handleMonthSelect = (index: number) => {
    const today = dayjs();
    const isCurrentMonth = today.year() === year && today.month() === index;
    const dayInNewMonth = Math.min(
      today.date(),
      dayjs(`${year}-${index + 1}`).daysInMonth()
    );
    const newSelectedIndex = isCurrentMonth ? dayInNewMonth - 1 : 0;

    setMonth(index);
    setSelectedIndex(newSelectedIndex);
    setShowMonthModal(false);
    hasScrolledInitially.current = false;
  };

  return (
    <div
      className="mt-[80px] flex flex-col content-container"
      style={{ height: "calc(100vh - 80px)" }}
    >
      <header className="fixed top-0 left-0 right-0 h-[80px] bg-gradient-to-br from-[var(--color-primary)] to-[#a67c52] text-white shadow-md z-50">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="w-6"></div>
          <button
            onClick={() => setShowMonthModal(true)}
            className="text-lg font-semibold tracking-wide hover:text-[#f1dec9] transition-colors"
          >
            {monthLabels[month]} {year}
          </button>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate("/add")}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-br from-[var(--color-primary)] to-[#a67c52] text-white rounded-full shadow-lg z-40 flex items-center justify-center"
      >
        <LucidePlus size={24} />
      </button>

      <div className="px-4 py-3 bg-[#faf4ef] shrink-0 overflow-x-auto whitespace-nowrap flex gap-3 scrollbar-hide">
        {days.map((day, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={index}
              ref={(el) => {
                dayRefs.current[index] = el;
              }}
              onClick={() => setSelectedIndex(index)}
              className={`relative min-w-[60px] h-[90px] shrink-0 rounded-xl px-2 py-2 flex flex-col items-center justify-center transition-colors duration-200 ${
                isSelected
                  ? "bg-[#B48D62] text-white"
                  : "bg-[#f1dec9] text-[#855B31]"
              }`}
            >
              <span className="text-xs">{day.day}</span>
              <span className="text-xl font-semibold leading-none">
                {day.date}
              </span>
              {day.total > 0 && (
                <span className="absolute bottom-[-10px] px-2 py-[2px] text-[11px] rounded-full border shadow-sm bg-white text-[#8d8577]">
                  {day.done}/{day.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-3 todo-list">
        {todos
          .filter((todo) => todo.date === currentDate)
          .map((todo) => (
            <div
              key={todo.id}
              className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-start gap-3"
            >
              <button
                onClick={() => toggleDone(todo.id, todo.is_done)}
                className={`w-5 h-5 mt-1 flex items-center justify-center rounded-full border-2 ${
                  todo.is_done
                    ? "bg-[#855B31] border-[#855B31] text-white"
                    : "border-[#855B31]"
                }`}
              >
                {todo.is_done && <Check size={14} strokeWidth={3} />}
              </button>
              <div className="flex-1">
                <div className="font-medium text-[#855B31]">{todo.title}</div>
                {todo.time && (
                  <div className="text-sm text-[#855B31] flex items-center gap-1 mt-0.5">
                    <Clock
                      size={16}
                      strokeWidth={2}
                      className="text-[#855B31]"
                    />
                    <span>{todo.time.slice(0, 5)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="w-6 h-6 mt-1 flex items-center justify-center text-[#855B31]"
                aria-label={`Aufgabe "${todo.title}" löschen`}
              >
                <Trash2 size={20} strokeWidth={2} />
              </button>
            </div>
          ))}
      </div>

      {showMonthModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMonthModal(false);
          }}
        >
          <div className="bg-[#faf4ef] rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => {
                  const newYear = year - 1;
                  const daysInMonth = dayjs(
                    `${newYear}-${month + 1}-01`
                  ).daysInMonth();
                  const isCurrentMonthAndYear =
                    today.month() === month && today.year() === newYear;
                  const dayExists = today.date() <= daysInMonth;
                  setSelectedIndex(
                    isCurrentMonthAndYear && dayExists ? today.date() - 1 : 0
                  );
                  setYear(newYear);
                  hasScrolledInitially.current = false;
                }}
                className="p-2 hover:bg-[#e9d8c4] rounded-lg text-[#855B31] transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-semibold text-[#855B31]">{year}</h2>
              <button
                onClick={() => {
                  const newYear = year + 1;
                  const daysInMonth = dayjs(
                    `${newYear}-${month + 1}-01`
                  ).daysInMonth();
                  const isCurrentMonthAndYear =
                    today.month() === month && today.year() === newYear;
                  const dayExists = today.date() <= daysInMonth;
                  setSelectedIndex(
                    isCurrentMonthAndYear && dayExists ? today.date() - 1 : 0
                  );
                  setYear(newYear);
                  hasScrolledInitially.current = false;
                }}
                className="p-2 hover:bg-[#e9d8c4] rounded-lg text-[#855B31] transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {monthShort.map((monthName, index) => (
                <button
                  key={monthName}
                  onClick={() => handleMonthSelect(index)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    month === index
                      ? "bg-[#B48D62] text-white ring-2 ring-[#a67c52] font-semibold"
                      : "bg-[#f1dec9] text-[#855B31] hover:bg-[#e9d8c4]"
                  }`}
                >
                  {monthName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
