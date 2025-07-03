import React from "react";
import TextField from "@mui/material/TextField";

const FormTextField = ({ id, label, name, defaultValue, inputProps, ...rest }) =>
{
    return (
        <TextField
            fullWidth
            id={id}
            label={label}
            name={name}
            defaultValue={defaultValue}
            sx={{
                color: "white",
            }}
            InputLabelProps={{
                sx: { color: "currentcolor" },
            }}
            InputProps={{
                sx: {
                    color: "currentcolor",
                },
                inputProps: inputProps,
            }}
            FormHelperTextProps={{
                sx: { color: "currentcolor" },
            }}
            {...rest}
        />
    );
};

export default FormTextField;
