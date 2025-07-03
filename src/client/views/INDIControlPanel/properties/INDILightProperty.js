import React from "react";
import { Box, Typography } from "@mui/material";
import { Palette } from "@common/shared/common/styles";

const INDILightProperty = ({ lights }) =>
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px" }}>
        {lights.map((lightProp, index) =>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: "4px" }} key={index}>
                <Box sx={[{
                    height: 15,
                    width: 15,
                    borderRadius: 15,
                }, lightProp.state ? LOCAL_STYLES.lightGreen : LOCAL_STYLES.lightGrey]} />
                <Typography sx={[LOCAL_STYLES.lightContainer]}>{lightProp.label}</Typography>
            </Box>)}
    </Box>

const LOCAL_STYLES = {
    lightContainer: {
        borderWidth: `1px solid ${Palette.grey44}`,
        backgroundColor: Palette.grey33,
        borderRadius: "2px",
        paddingInline: "20px",
        paddingBlock: "3px",
        fontSize: "12px",
        color: "white",
    },
    lightGreen: {
        border: "1.5px solid green",
        backgroundColor: Palette.green,
    },
    lightGrey: {
        border: `1.5px solid ${Palette.grey44}`,
        backgroundColor: Palette.greycc,
    },
};

export default INDILightProperty;