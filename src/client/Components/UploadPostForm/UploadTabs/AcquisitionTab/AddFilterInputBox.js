import React from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";

const AddFilterInputBox = (props) =>
{
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: ".25rem",
                alignItems: "center",
            }}
        >
            <Typography sx={{ textTransform: "capitalize" }}>{props.name}</Typography>
            <TextField
                {...props}
                InputLabelProps={{ sx: { color: Palette.white70 } }}
                InputProps={{ sx: { height: "100%", color: Palette.white } }}
            />
        </Box>
    );
};

export default AddFilterInputBox;
