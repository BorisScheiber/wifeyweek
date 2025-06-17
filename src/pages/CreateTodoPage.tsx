import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { todoService } from "../services/todoService";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarDays, Clock, XCircle } from "lucide-react";
import { registerLocale } from "react-datepicker";
import { de } from "date-fns/locale/de";

// Registriere deutsche Lokalisierung
registerLocale("de", de);

export default function CreateTodoPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Bitte geben Sie einen Titel ein");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await todoService.add({
        title: title.trim(),
        time: time || null,
        date: date,
        is_done: false,
      });

      navigate(-1); // Zurück zur vorherigen Seite
    } catch (err) {
      setError("Fehler beim Speichern der Aufgabe");
      console.error("Error adding todo:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#faf4ef] px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-[#855B31] mb-8 text-center">
          Neue Aufgabe hinzufügen
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titel-Eingabe */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-[#855B31] mb-2"
            >
              Titel *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError("");
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                error
                  ? "border-red-400 bg-red-50"
                  : "border-[#f1dec9] bg-white focus:border-[#B48D62] focus:outline-none"
              }`}
              placeholder="Was gibts zu tun babe? (:"
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {/* Datum-Eingabe mit Icon */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-[#855B31] mb-2"
            >
              Datum *
            </label>
            <div className="relative w-full">
              <DatePicker
                selected={dayjs(date).toDate()}
                onChange={(d: Date | null) =>
                  setDate(dayjs(d).format("YYYY-MM-DD"))
                }
                wrapperClassName="w-full"
                className="w-full pr-10 px-4 py-3 rounded-xl border-2 border-[#f1dec9] bg-white focus:border-[#B48D62] focus:outline-none transition-colors"
                dateFormat="dd.MM.yyyy"
                disabled={isLoading}
              />
              <CalendarDays className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#855B31] pointer-events-none" />
            </div>
          </div>

          {/* Uhrzeit-Eingabe mit Icon */}
          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-[#855B31] mb-2"
            >
              Uhrzeit (optional)
            </label>
            <div className="relative w-full">
              <DatePicker
                selected={time ? dayjs(`2000-01-01 ${time}`).toDate() : null}
                onChange={(d: Date | null) =>
                  setTime(d ? dayjs(d).format("HH:mm") : "")
                }
                wrapperClassName="w-full"
                className="w-full pr-10 px-4 py-3 rounded-xl border-2 border-[#f1dec9] bg-white focus:border-[#B48D62] focus:outline-none transition-colors"
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Uhrzeit"
                dateFormat="HH:mm"
                placeholderText="Uhrzeit auswählen"
                disabled={isLoading}
                locale="de"
                timeFormat="HH:mm"
              />
              {time ? (
                <XCircle
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#855B31] cursor-pointer hover:text-[#B48D62] transition-colors"
                  onClick={() => setTime("")}
                />
              ) : (
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#855B31] pointer-events-none" />
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-[#f1dec9] bg-white text-[#855B31] font-medium hover:bg-[#f1dec9] transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 px-6 py-3 rounded-xl bg-[#B48D62] text-white font-medium hover:bg-[#a67c52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Speichern..." : "Hinzufügen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
