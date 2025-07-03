import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { Palette } from "@common/shared/common/styles";
import { styles } from "../../shared/styles";

const PromptCounter = ({ promptsLeft }) =>
{
    if (typeof promptsLeft === "undefined" || promptsLeft > 100) return null;

    return (
        <Box sx={[LOCAL_STYLES.badgeView, styles.center, { backgroundColor: Palette.red }]}>
            <Typography sx={[styles.text, { fontSize: "12px" }]}>{promptsLeft}</Typography>
        </Box>
        // <Typography sx={{ color: "inherit", fontSize: "inherit", border: `0.7px solid ${Palette.red}`, padding: "1px 2px" }} component="span">
        //     prompts left: {promptsLeft}
        // </Typography>
    );
};

const LOCAL_STYLES = {
    badgeView: {
        borderRadius: "25px",
        width: "35px",
        height: "25px",
    },
    badgeMainView: {
        flexDirection: "row",
        marginTop: "5px",
        justifyContent: "space-evenly",
        width: "150px",
    },
};

export default PromptCounter;
