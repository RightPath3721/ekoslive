import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CheckBox from "@mui/material/Checkbox";

const FormCheckbox = ({
    label,
    name,
    id,
    containerStyles = {},
    labelStyles = {},
    checkBoxStyles = {},
    ...rest
}) =>
{
    return (
        <Box
            sx={[
                {
                    display: "grid",
                    gridTemplateColumns: "30px auto",
                    gap: "16px",
                    justifyContent: "flex-start",
                    alignItems: "center",
                },
                containerStyles,
            ]}
        >
            <CheckBox
                style={{ color: "white", padding: 0 }}
                sx={[checkBoxStyles]}
                name={name}
                id={id}
                {...rest}
            />
            <Typography sx={[labelStyles]}>{label}</Typography>
        </Box>
    );
};

export default FormCheckbox;
