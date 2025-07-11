import React from "react";
import { LocalizationProvider, MobileTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

// Dayjs Locale Import - WICHTIG!
import "dayjs/locale/de";

interface TimeFieldProps {
  value: string; // HH:mm format or empty string
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function TimeField({
  value,
  onChange,
  disabled = false,
}: TimeFieldProps) {
  // Aktiviere deutsche Lokalisierung für dayjs
  dayjs.locale("de");

  const handleChange = (newValue: dayjs.Dayjs | null) => {
    onChange(newValue ? dayjs(newValue).format("HH:mm") : "");
  };

  return (
    <div>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
        <MobileTimePicker
          localeText={{
            fieldHoursPlaceholder: () => "Std",
            fieldMinutesPlaceholder: () => "Min",
          }}
          label=""
          value={value ? dayjs(`2000-01-01T${value}`) : null}
          onChange={handleChange}
          ampm={false}
          minutesStep={5}
          disabled={disabled}
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
  );
}
