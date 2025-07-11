import React from "react";
import { Listbox, ListboxButton, ListboxOptions } from "@headlessui/react";
import { ChevronDown } from "lucide-react";

interface RepeatFieldProps {
  repeatCount: number | null;
  setRepeatCount: (value: number | null) => void;
  repeatUnit: string;
  setRepeatUnit: (value: string) => void;
  error?: string;
  disabled?: boolean;
  onErrorChange?: (error: string) => void;
}

export default function RepeatField({
  repeatCount,
  setRepeatCount,
  repeatUnit,
  setRepeatUnit,
  error,
  disabled = false,
  onErrorChange,
}: RepeatFieldProps) {
  // Optionen für Wiederholung
  const repeatCountOptions = Array.from({ length: 30 }, (_, i) => i + 1);
  const repeatUnitOptions = [
    { value: "day", label: "Tage" },
    { value: "week", label: "Wochen" },
    { value: "month", label: "Monate" },
  ];

  const handleCountChange = (value: number | null) => {
    setRepeatCount(value);
    // Nur löschen wenn beide Felder korrekt ausgefüllt sind
    if (error && value && repeatUnit && onErrorChange) {
      onErrorChange("");
    }
  };

  const handleUnitChange = (value: string) => {
    setRepeatUnit(value);
    // Nur löschen wenn beide Felder korrekt ausgefüllt sind
    if (error && repeatCount && value && onErrorChange) {
      onErrorChange("");
    }
  };

  return (
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
          onChange={handleCountChange}
          disabled={disabled}
        >
          <div className="relative flex-1">
            <ListboxButton
              className={`relative w-full rounded-xl border-2 transition-colors px-3 py-2 h-[55px] text-sm text-left focus:outline-none disabled:opacity-50 ${
                error && !repeatCount
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
                      active ? "bg-[#f1dec9] text-[#855B31]" : "text-[#855B31]"
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
          onChange={handleUnitChange}
          disabled={disabled}
        >
          <div className="relative flex-1">
            <ListboxButton
              className={`relative w-full rounded-xl border-2 transition-colors px-3 py-2 h-[55px] text-sm text-left focus:outline-none disabled:opacity-50 ${
                error && !repeatUnit
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
                      active ? "bg-[#f1dec9] text-[#855B31]" : "text-[#855B31]"
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
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
