import React from "react";
import { keyframes } from '@mui/system';
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";

const pulse = keyframes`
0% {
    transform: scale(0.8);
    background-color: ${Palette.orange};
    box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
  }

  50% {
    transform: scale(1.2);
    background-color: ${Palette.orange};
    box-shadow: 0 0 0 4px rgba(178, 212, 252, 0);
  }

  100% {
    transform: scale(0.8);
    background-color: ${Palette.orange};
    box-shadow: 0 0 0 0 rgba(178, 212, 252, 0.7);
  }
`;

const StellaLoader = ({ prompt }) =>
{
    return (
        <Paper sx={[LOCAL_STYLES.containerStyles]} elevation={2}>
            <Paper sx={[LOCAL_STYLES.promptBox]} elevation={2}>{prompt}</Paper>

            <Box sx={[LOCAL_STYLES.indicatorContainer]}>
                <Typography sx={{ color: Palette.white, fontStyle: "italic", fontSize: "14px" }}>Stella is typing</Typography>
                <Box sx={[LOCAL_STYLES.dotContainer]}>
                    <Box sx={[LOCAL_STYLES.dot, { animation: `${pulse} 1.5s infinite ease-in-out`, animationDelay: "-0.3s" }]} />
                    <Box sx={[LOCAL_STYLES.dot, { animation: `${pulse} 1.5s infinite ease-in-out`, animationDelay: "-0.1s" }]} />
                    <Box sx={[LOCAL_STYLES.dot, { animation: `${pulse} 1.5s infinite ease-in-out`, animationDelay: "0.3s" }]} />
                </Box>
            </Box>
        </Paper>
    )
};

const LOCAL_STYLES = {
    indicatorContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "6px",
        alignSelf: "flex-start",
    },
    dotContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },
    dot: {
        height: "8px",
        width: "8px",
        borderRadius: "50%",
        backgroundColor: Palette.orange,
    },
    containerStyles: {
        position: "relative",
        display: "grid",
        backgroundColor: "#FFFCFA1F",
        borderRadius: "12px",
        padding: "14px 10px",
        rowGap: "12px",
        alignItems: "center",
        width: "98%",
    },
    promptBox: {
        color: Palette.white,
        padding: "6px",
        gridColumn: "span 2",
        backgroundColor: "#444",
        lineHeight: "24px",
    },
};

export default StellaLoader