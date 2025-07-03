import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const GraphLegend = ({ data }) =>
{
    return (
        <Box sx={{
            position: "fixed",
            bottom: "16px",
            left: "15%",
            display: "flex",
            flexDirection: "row",
            gap: "12px",
        }}>
            {data.map((item) => (
                <Typography key={item.title} sx={{ display: "inline-flex", alignItems: "center", color: "white" }}>
                    <Typography sx={{ backgroundColor: item.color, width: "10px", height: "1px", display: "inline-block" }} component="span" />
                    &nbsp;{item.title}
                </Typography>)
            )}
        </Box>
    );
}

export default GraphLegend