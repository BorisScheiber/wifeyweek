import React from "react";

interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  onErrorChange?: (error: string) => void;
}

export default function TitleField({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Was gibts zu tun babe? (:",
  onErrorChange,
}: TitleFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    // Fehler löschen wenn eingegeben wird
    if (error && onErrorChange) {
      onErrorChange("");
    }
  };

  return (
    <div>
      <input
        type="text"
        id="title"
        value={value}
        onChange={handleChange}
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
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--color-error)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
