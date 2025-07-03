import React from "react";
import Button from "@mui/material/Button";

const NumericButton = ({ style, disabled, children, onClick = () => { } }) =>
{
    return (
        <Button
            sx={[{
                backgroundColor: "#3b3737",
                minWidth: "auto",
            }, style]}
            disabled={disabled}
            onClick={onClick}>
            {children}
        </Button>
    )
}

export default NumericButton;