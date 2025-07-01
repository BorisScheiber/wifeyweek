import {
  LucidePlus,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { todoService } from "../services/todoService";
import dayjs from "dayjs";
import SwipeableItem from "../components/SwipeableItem";
import { usePrefetchTodos } from "../hooks/usePrefetchTodos";
import { useTodoMutations } from "../hooks/useTodoMutations";
import { useRealtimeSync } from "../hooks/useRealtimeSync";

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
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasScrolledInitially = useRef(false);

  // useQuery für todos mit automatic refetch bei month/year change
  const {
    data: todos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["todos", year, month],
    queryFn: async () => {
      // Zuerst wiederkehrende Aufgaben für diesen Monat generieren
      await todoService.generateRecurringTodosForMonth(year, month);
      // Dann alle Todos für den Monat laden
      return todoService.getByMonth(year, month);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Prefetch für 3 Monate (current ±1) im Hintergrund
  usePrefetchTodos(year, month);

  // Mutations für optimistic updates
  const { toggleTodo, deleteTodo } = useTodoMutations();

  // Realtime sync für Multi-Device Updates
  useRealtimeSync();

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

  // Error handling für useQuery
  if (error) {
    console.error("Fehler beim Laden der Todos:", error);
  }

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

  // Use mutations instead of direct service calls
  const handleToggleDone = (id: string, is_done: boolean) => {
    toggleTodo.mutate({ id, is_done });
  };

  const handleDeleteTodo = (id: string) => {
    deleteTodo.mutate({ id });
  };

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
      <header className="fixed top-0 left-0 right-0 h-[80px]  text-white z-50">
        <div className="h-full px-4 flex items-center justify-between z-50">
          <div className="w-6"></div>
          <button
            onClick={() => setShowMonthModal(true)}
            className="text-xl font-bold tracking-wide hover:text-[#f1dec9] transition-colors z-50 text-shadow-white"
          >
            {monthLabels[month]} {year}
          </button>
          <div className="w-6"></div>
        </div>
        <svg
          className="waves"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 24 150 28"
          preserveAspectRatio="none"
          shapeRendering="auto"
        >
          <defs>
            <path
              id="gentle-wave"
              d="M-160 44c30 0 58-18 88-18s 58 18 88 18
         58-18 88-18 58 18 88 18 v44h-352z"
            />
          </defs>
          {/* <g className="parallax">
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="0"
              fill="rgba(145, 105, 65, 1)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="3"
              fill="rgba(179, 140, 97, 0.5)"
            />
            <use
              xlinkHref="#gentle-wave"
              x="48"
              y="5"
              fill="rgba(241, 222, 201, 0.4)"
            />
          </g> */}
        </svg>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-[#855B31]">Todos werden geladen...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-red-600">Fehler beim Laden der Todos</div>
          </div>
        ) : (
          todos
            .filter((todo) => todo.date === currentDate)
            .sort((a, b) => {
              // Wenn beide Todos eine Zeit haben, sortiere nach Zeit
              if (a.time && b.time) {
                return a.time.localeCompare(b.time);
              }
              // Todos ohne Zeit kommen nach Todos mit Zeit
              if (a.time && !b.time) return -1;
              if (!a.time && b.time) return 1;
              // Beide ohne Zeit - behalte ursprüngliche Reihenfolge
              return 0;
            })
            .map((todo) => (
              <SwipeableItem
                key={todo.id}
                onDelete={() => handleDeleteTodo(todo.id)}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleDone(todo.id, todo.is_done)}
                    className={`w-5 h-5 mt-1 flex items-center justify-center rounded-full border-2 ${
                      todo.is_done
                        ? "bg-[#855B31] border-[#855B31] text-white"
                        : "border-[#855B31]"
                    }`}
                  >
                    {todo.is_done && <Check size={14} strokeWidth={3} />}
                  </button>
                  <div className="flex-1">
                    <div className="font-medium text-[#855B31]">
                      {todo.title}
                    </div>
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
                </div>
              </SwipeableItem>
            ))
        )}
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
