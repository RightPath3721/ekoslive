import React from "react";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import IconButton from "@mui/material/IconButton";

const CopyButton = ({ top = 0, right = 0, onClick, size = 30, sx = {} }) =>
{
    return (
        <IconButton sx={{ position: "absolute", top, right, padding: 0, ...sx }} onClick={onClick}>
            <ContentCopyIcon style={{ color: "white", fontSize: size }} />
        </IconButton>
    )
}

export default CopyButton