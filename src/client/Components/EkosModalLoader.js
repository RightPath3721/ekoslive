import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { Palette } from "@common/shared/common/styles";

const EkosModalLoader = () =>
{
    return (
        <Box sx={{ width: "100%", display: "grid", placeItems: "center" }}>
            <CircularProgress size={40} sx={{ color: Palette.orange }} />
        </Box>
    )
}

export default EkosModalLoader