import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { todoService } from "../services/todoService";
import dayjs from "dayjs";
import { registerLocale } from "react-datepicker";
import { de } from "date-fns/locale/de";
import {
  LocalizationProvider,
  MobileTimePicker,
  MobileDatePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Dayjs Locale Import - WICHTIG!
import "dayjs/locale/de";

// Registriere deutsche Lokalisierung für react-datepicker
registerLocale("de", de);

export default function CreateTodoPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Aktiviere deutsche Lokalisierung für dayjs
  dayjs.locale("de");

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
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "16px",
              }}
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
              className={`w-full px-4 rounded-xl border-2 transition-colors ${
                error
                  ? "border-red-400 bg-red-50"
                  : "border-[#f1dec9] bg-white focus:border-[#B48D62] focus:outline-none"
              }`}
              style={{
                height: "55px", // Gleiche Höhe wie Picker
                color: "#855B31", // Gleiche Textfarbe
                fontSize: "16px", // Gleiche Schriftgröße
                fontFamily: '"Quicksand", sans-serif', // Gleiche Schriftart
              }}
              placeholder="Was gibts zu tun babe? (:"
              disabled={isLoading}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          {/* Datum-Eingabe mit MUI DatePicker */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-[#855B31] mb-2"
              style={{ fontSize: "16px" }}
            >
              Datum *
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
              <MobileDatePicker
                label=""
                value={dayjs(date)}
                onChange={(newValue: dayjs.Dayjs | null) =>
                  setDate(
                    newValue
                      ? dayjs(newValue).format("YYYY-MM-DD")
                      : dayjs().format("YYYY-MM-DD")
                  )
                }
                format="DD.MM.YYYY"
                disabled={isLoading}
                openTo="day"
                sx={{
                  width: "100%",
                  // Hintergrundfarbe auf dem Root-Element setzen
                  "& .MuiPickersInputBase-root": {
                    backgroundColor: "#ffffff !important",
                    borderRadius: "0.75rem",
                    padding: "0 16px",
                  },
                  // Border ohne Background
                  "& .MuiPickersOutlinedInput-notchedOutline": {
                    borderColor: "#f1dec9 !important",
                    borderWidth: "2px !important",
                  },
                  // Focus State
                  "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
                    {
                      borderColor: "#B48D62 !important",
                      borderWidth: "2px !important",
                    },
                  "& .MuiInputLabel-root": {
                    color: "#855B31",
                    fontWeight: "500",
                    "&.Mui-focused": {
                      color: "#B48D62",
                      fontWeight: "500",
                    },
                  },
                  "& .MuiPickersSectionList-root": {
                    padding: "16px 0 !important",
                  },
                  // Input Text Styling
                  "& .MuiPickersInputBase-input": {
                    color: "#855B31",
                    padding: "12px 16px",
                  },
                  // Section Content (die DD.MM.YYYY Bereiche)
                  "& .MuiPickersInputBase-sectionContent": {
                    color: "#855B31",
                    fontFamily: '"Quicksand", sans-serif !important',
                    fontSize: "16px !important",
                  },
                  // Icon Button explizit sichtbar machen
                  "& .MuiInputAdornment-root": {
                    position: "relative",
                    zIndex: 1,
                    margin: "0 0 0 0",
                  },
                  "& .MuiButtonBase-root": {
                    margin: "0 0 0 0",
                  },
                  "& .MuiIconButton-root": {
                    color: "#855B31",
                    padding: "0 0 0 0",
                    "&:hover": {
                      backgroundColor: "transparent !important",
                    },
                    "&:active": {
                      backgroundColor: "transparent !important",
                    },
                    "&.Mui-focusVisible": {
                      backgroundColor: "transparent !important",
                    },
                    "& .MuiTouchRipple-root": {
                      display: "none !important",
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#855B31 !important",
                    width: "24px !important",
                    height: "24px !important",
                  },
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "medium",
                  },
                }}
              />
            </LocalizationProvider>
          </div>

          {/* MUI TimePicker mit Custom Styling */}
          <div>
            <label
              htmlFor="time"
              className="block text-sm font-medium text-[#855B31] mb-2"
              style={{ fontSize: "16px" }}
            >
              Uhrzeit (optional)
            </label>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
              <MobileTimePicker
                localeText={{
                  fieldHoursPlaceholder: () => "Std",
                  fieldMinutesPlaceholder: () => "Min",
                }}
                label=""
                value={time ? dayjs(`2000-01-01T${time}`) : null}
                onChange={(newValue: dayjs.Dayjs | null) =>
                  setTime(newValue ? dayjs(newValue).format("HH:mm") : "")
                }
                ampm={false}
                minutesStep={5}
                disabled={isLoading}
                openTo="hours"
                sx={{
                  width: "100%",
                  // Hintergrundfarbe auf dem Root-Element setzen
                  "& .MuiPickersInputBase-root": {
                    backgroundColor: "#ffffff !important",
                    borderRadius: "0.75rem",
                    padding: "0 16px",
                  },
                  // Border ohne Background
                  "& .MuiPickersOutlinedInput-notchedOutline": {
                    borderColor: "#f1dec9 !important",
                    borderWidth: "2px !important",
                    // backgroundColor hier ENTFERNEN!
                  },
                  // Focus State
                  "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
                    {
                      borderColor: "#B48D62 !important",
                      borderWidth: "2px !important",
                    },
                  "& .MuiInputLabel-root": {
                    color: "#855B31",
                    fontWeight: "500",
                    "&.Mui-focused": {
                      color: "#B48D62",
                      fontWeight: "500",
                    },
                  },
                  "& .MuiPickersSectionList-root": {
                    padding: "16px 0 !important", // py-3 px-4
                  },
                  // Input Text Styling
                  "& .MuiPickersInputBase-input": {
                    color: "#855B31",
                    padding: "12px 16px",
                  },
                  // Section Content (die hh:mm Bereiche)
                  "& .MuiPickersInputBase-sectionContent": {
                    color: "#855B31",
                    fontFamily: '"Quicksand", sans-serif !important',
                    fontSize: "16px !important",
                  },
                  // Icon Button explizit sichtbar machen
                  "& .MuiInputAdornment-root": {
                    position: "relative",
                    zIndex: 1,
                    margin: "0 0 0 0",
                  },
                  "& .MuiButtonBase-root": {
                    margin: "0 0 0 0",
                  },
                  "& .MuiIconButton-root": {
                    color: "#855B31",
                    padding: "0 0 0 0",
                    "&:hover": {
                      backgroundColor: "transparent !important",
                    },
                    "&:active": {
                      backgroundColor: "transparent !important",
                    },
                    "&.Mui-focusVisible": {
                      backgroundColor: "transparent !important",
                    },
                    "& .MuiTouchRipple-root": {
                      display: "none !important",
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#855B31 !important",
                    width: "24px !important",
                    height: "24px !important",
                  },
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    size: "medium",
                  },
                }}
              />
            </LocalizationProvider>
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
