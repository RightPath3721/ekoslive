import * as React from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

export default function DatePicker({
  value,
  handleChange,
  disabled,
  mode,
  open,
  containerStyles = {},
})
{
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack sx={{ ...containerStyles }} spacing={3}>
        {mode === "time" && (
          <TimePicker
            disabled={disabled}
            label="Time"
            open={open}
            value={value}
            sx={{ color: "white" }}
            onChange={() => { }}
            closeOnSelect
            onAccept={handleChange}
            renderInput={(params) => (
              <TextField
                sx={{
                  color: "white",
                  backgroundColor: "#1D1D1D",
                  ".MuiFormLabel-root": {
                    color: "#FFFFFF80",
                  },
                  ".MuiInputBase-input": {
                    color: "#FFFFFF80",
                  },
                  ".MuiButtonBase-root": {
                    color: "#FFFFFF80",
                  },
                }}
                {...params}
              />
            )}
          />
        )}
        {mode === "datetime" && (
          <DateTimePicker
            value={value}
            style={{ color: "white" }}
            onChange={handleChange}
            renderInput={(params) => (
              <TextField
                sx={{
                  color: "white",
                  backgroundColor: "#1D1D1D",
                  ".MuiFormLabel-root": {
                    color: "#FFFFFF80",
                  },
                  ".MuiInputBase-input": {
                    color: "#FFFFFF80",
                  },
                  ".MuiButtonBase-root": {
                    color: "#FFFFFF80",
                  },
                }}
                {...params}
              />
            )}
          />
        )}
      </Stack>
    </LocalizationProvider>
  );
}
