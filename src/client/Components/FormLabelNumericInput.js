import React from 'react'
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import NumericInput from './NumericInput/NumericInput';
import { Palette } from "@common/shared/common/styles";

const FormLabelNumericInput = ({ id, name, onChange, width = 120, gap = ".25rem", value, ...rest }) =>
{
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: `${width}px 1fr`,
                gap,
                alignItems: "center",
            }}
        >
            <Typography sx={{ textTransform: "capitalize" }}>
                {name}
            </Typography>
            <NumericInput
                onChange={onChange}
                initialValue={value}
                totalWidth={parseInt(width) * 1.3}
                textColor={Palette.white}
                extraTextInputProps={{ name, id, ...rest }}
            />
        </Box>
    )
}

export default FormLabelNumericInput