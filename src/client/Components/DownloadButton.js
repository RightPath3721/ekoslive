import React from "react";
import IconButton from "@mui/material/IconButton";
import DownloadIcon from '@mui/icons-material/Download';

const DownloadButton = ({ top = 0, right = 0, onClick, size = 30, sx = {} }) =>
{
    return (
        <IconButton sx={{ position: "absolute", top, right, padding: 0, ...sx }} onClick={onClick}>
            <DownloadIcon style={{ color: "white", fontSize: size }} />
        </IconButton>
    )
}

export default DownloadButton