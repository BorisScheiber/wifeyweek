import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTodoMutations } from "../hooks/useTodoMutations";
import dayjs from "dayjs";
import { registerLocale } from "react-datepicker";
import { de } from "date-fns/locale/de";
import {
  LocalizationProvider,
  MobileTimePicker,
  MobileDatePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LucideX, LucideCheck, ChevronDown } from "lucide-react";
import { Listbox, ListboxButton, ListboxOptions } from "@headlessui/react";

// Dayjs Locale Import - WICHTIG!
import "dayjs/locale/de";

// Registriere deutsche Lokalisierung für react-datepicker
registerLocale("de", de);

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

  // Optionen für Wiederholung
  const repeatCountOptions = Array.from({ length: 30 }, (_, i) => i + 1);
  const repeatUnitOptions = [
    { value: "day", label: "Tage" },
    { value: "week", label: "Wochen" },
    { value: "month", label: "Monate" },
  ];

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
          <div>
            {/* <label
              htmlFor="title"
              className="block text-sm font-medium text-[#855B31] mb-2"
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "16px",
              }}
            >
              Titel *
            </label> */}
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
                  ? "border-[var(--color-error)]"
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
            {error && (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-error)" }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Datum-Eingabe mit MUI DatePicker */}
          <div>
            {/* <label
              htmlFor="date"
              className="block text-sm font-medium text-[#855B31] mb-2"
              style={{ fontSize: "16px" }}
            >
              Datum *
            </label> */}
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
            {/* <label
              htmlFor="time"
              className="block text-sm font-medium text-[#855B31] mb-2"
              style={{ fontSize: "16px" }}
            >
              Uhrzeit (optional)
            </label> */}
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

          {/* Wiederholungsfeld */}
          <div>
            <label
              htmlFor="repeat"
              className="block text-sm font-medium text-[#855B31] mb-2"
              style={{
                fontFamily: '"Quicksand", sans-serif',
                fontSize: "16px",
              }}
            >
              Wiederholen (optional)
            </label>
            <div className="flex gap-3">
              {/* Anzahl Dropdown */}
              <Listbox
                value={repeatCount}
                onChange={(value) => {
                  setRepeatCount(value);
                  // Nur löschen wenn beide Felder korrekt ausgefüllt sind
                  if (repeatError && value && repeatUnit) {
                    setRepeatError("");
                  }
                }}
                disabled={isLoading}
              >
                <div className="relative flex-1">
                  <ListboxButton
                    className={`relative w-full rounded-xl border-2 transition-colors px-3 py-2 h-[55px] text-sm text-left focus:outline-none disabled:opacity-50 ${
                      repeatError && !repeatCount
                        ? "border-[var(--color-error)]"
                        : "border-[#f1dec9] bg-white focus:border-[#B48D62]"
                    }`}
                  >
                    <span
                      className="block truncate"
                      style={{
                        fontFamily: '"Quicksand", sans-serif',
                        fontSize: "16px",
                        color: repeatCount ? "#855B31" : "#CCBAA9",
                      }}
                    >
                      {repeatCount || "Auswählen"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown
                        className="h-5 w-5 text-[#855B31]"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-10 mt-1 max-h-[124px] w-full overflow-auto rounded-xl bg-white border-2 border-[#f1dec9] shadow-lg focus:outline-none">
                    {repeatCountOptions.map((count) => (
                      <Listbox.Option
                        key={count}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 px-3 ${
                            active
                              ? "bg-[#f1dec9] text-[#855B31]"
                              : "text-[#855B31]"
                          }`
                        }
                        value={count}
                      >
                        {({ selected }) => (
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                            style={{ fontFamily: '"Quicksand", sans-serif' }}
                          >
                            {count}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>

              {/* Einheit Dropdown */}
              <Listbox
                value={repeatUnit}
                onChange={(value) => {
                  setRepeatUnit(value);
                  // Nur löschen wenn beide Felder korrekt ausgefüllt sind
                  if (repeatError && repeatCount && value) {
                    setRepeatError("");
                  }
                }}
                disabled={isLoading}
              >
                <div className="relative flex-1">
                  <ListboxButton
                    className={`relative w-full rounded-xl border-2 transition-colors px-3 py-2 h-[55px] text-sm text-left focus:outline-none disabled:opacity-50 ${
                      repeatError && !repeatUnit
                        ? "border-[var(--color-error)]"
                        : "border-[#f1dec9] bg-white focus:border-[#B48D62]"
                    }`}
                  >
                    <span
                      className="block truncate"
                      style={{
                        fontFamily: '"Quicksand", sans-serif',
                        fontSize: "16px",
                        color: repeatUnit ? "#855B31" : "#CCBAA9",
                      }}
                    >
                      {repeatUnit
                        ? repeatUnitOptions.find(
                            (option) => option.value === repeatUnit
                          )?.label
                        : "Auswählen"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronDown
                        className="h-5 w-5 text-[#855B31]"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white border-2 border-[#f1dec9] shadow-lg focus:outline-none">
                    {repeatUnitOptions.map((option) => (
                      <Listbox.Option
                        key={option.value}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 px-3 ${
                            active
                              ? "bg-[#f1dec9] text-[#855B31]"
                              : "text-[#855B31]"
                          }`
                        }
                        value={option.value}
                      >
                        {({ selected }) => (
                          <span
                            className={`block truncate ${
                              selected ? "font-medium" : "font-normal"
                            }`}
                            style={{ fontFamily: '"Quicksand", sans-serif' }}
                          >
                            {option.label}
                          </span>
                        )}
                      </Listbox.Option>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>
            {repeatError && (
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--color-error)" }}
              >
                {repeatError}
              </p>
            )}
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
