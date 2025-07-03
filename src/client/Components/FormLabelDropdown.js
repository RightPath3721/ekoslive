import React from 'react'
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Dropdown from './Dropdown';

const FormLabelDropdown = ({ label, onChange, options, width = 120, gap = ".25rem", value, ...rest }) =>
{
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: width,
                gap,
                alignItems: "center",
            }}
        >
            <Typography sx={{ textTransform: "capitalize" }}>
                {label}
            </Typography>
            <Dropdown options={options} onChange={onChange} value={value} {...rest} />
        </Box>
    )
}

export default FormLabelDropdown