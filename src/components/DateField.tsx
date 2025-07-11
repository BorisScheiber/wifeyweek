import React from "react";
import { LocalizationProvider, MobileDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// Dayjs Locale Import - WICHTIG!
import "dayjs/locale/de";

interface DateFieldProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function DateField({
  value,
  onChange,
  disabled = false,
}: DateFieldProps) {
  // Aktiviere deutsche Lokalisierung für dayjs
  dayjs.locale("de");

  const handleChange = (newValue: dayjs.Dayjs | null) => {
    onChange(
      newValue
        ? dayjs(newValue).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD")
    );
  };

  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
        <MobileDatePicker
          label=""
          value={dayjs(value)}
          onChange={handleChange}
          format="DD.MM.YYYY"
          disabled={disabled}
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
  );
}
