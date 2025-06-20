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
import { LucideX, LucideCheck } from "lucide-react";

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
        <h1 className="text-3xl  text-[#855B31] mb-8 text-center indie-flower">
          Aufgabe hinzufügen
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6" id="todo-form">
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
                  // HIER ist das Clock-Styling richtig platziert:
                  mobilePaper: {
                    sx: {
                      "& .MuiClock-clock": {
                        backgroundColor: "#f1dec9 !important",
                      },
                      // Clock Pin (der Mittelpunkt der Uhr)
                      "& .MuiClock-pin": {
                        backgroundColor: "#855B31 !important",
                      },
                      // Clock Pointer (der Zeiger)
                      "& .MuiClockPointer-root": {
                        backgroundColor: "#855B31 !important",
                      },
                      // Zeiger-Thumb (der Kreis am Ende des Zeigers)
                      "& .MuiClockPointer-thumb": {
                        backgroundColor: "#855B31 !important",
                        border: "16px solid #855B31 !important",
                      },
                      "& .MuiButtonBase-root.MuiButton-root": {
                        color: "#855B31 !important",
                        fontFamily: '"Quicksand", sans-serif !important',
                        fontWeight: "600 !important",
                      },
                      "& .MuiPickersToolbar-content .MuiButtonBase-root.MuiButton-root":
                        {
                          color: "#855B31 !important",

                          "& .MuiTypography-root.MuiPickersToolbarText-root": {
                            color: "#855B31 !important",
                            fontFamily: '"Quicksand", sans-serif !important',
                          },

                          "&:hover": {
                            backgroundColor: "#f1dec9 !important",
                          },
                        },
                      "& .MuiTimePickerToolbar-separator": {
                        color: "#855B31 !important",
                        fontFamily: '"Quicksand", sans-serif !important',
                      },
                      "& .MuiClockNumber-root": {
                        color: "#855B31 !important",
                        fontFamily: '"Quicksand", sans-serif !important',
                        fontWeight: "500 !important",
                      },
                      "& .MuiClockNumber-root.Mui-selected": {
                        color: "#FFFFFF !important",
                      },
                      "& .MuiPickersToolbar-title": {
                        color: "#855B31 !important",
                        fontFamily: '"Quicksand", sans-serif !important',
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </div>
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
