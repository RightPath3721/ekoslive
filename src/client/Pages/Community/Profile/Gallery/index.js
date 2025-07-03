import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";
import PreviewList from "./PreviewList";

const GalleryPreview = () =>
{
    return <div></div>
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: "12px",
                paddingRight: "12px",
            }}
        >
            <Typography sx={{ color: Palette.white, width: "100%" }} align="center">
                Gallery
            </Typography>
            <PreviewList />
        </Box>
    );
};

export default GalleryPreview;
