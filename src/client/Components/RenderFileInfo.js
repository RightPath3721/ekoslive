import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { styles } from "../shared/styles";

const RenderFileInfo = ({ data, text, containerStyles = {} }) =>
{
    return (
        <Box sx={[{ display: "flex", flexDirection: "column", width: "350px", padding: "12px", ...containerStyles }]}>
            {data.label.map((arr, index) =>
            {
                return (
                    <Box key={index} sx={[styles.row, { marginBottom: "8px" }]}>
                        <Typography sx={[styles.text, {
                            marginRight: "20px",
                            width: "120px",
                            fontSize: "14px"
                        }]}>{arr}:</Typography>
                        <Typography sx={[styles.text, {
                            width: "230px",
                            fontSize: "14px"
                        }]}>
                            {text.text[index]}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    )
}

export default RenderFileInfo