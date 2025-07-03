import { IconButton } from "@mui/material";
import React from "react"
import Icon from "./Icon";
import { useTheme } from "@mui/material/styles";

const CloseButton = ({ onChange, top = "10%", icon = "Close", right = "12%", iconSize, sx = {} }) => 
{
    const { palette } =useTheme();
    return (
        <IconButton
            sx={{
                position: "absolute",
                top: top,
                right: right,
                borderRadius: "4px",
                color: "white",
                zIndex: 1,
                width: "28px",
                height: "28px",
                padding: 0,
                ...sx,
            }}
            onClick={onChange}
        >
            <Icon name={icon} color={palette.white[900]} size={iconSize} />
        </IconButton>)
}

export default CloseButton;