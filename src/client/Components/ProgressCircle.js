import React from "react";
import Box from "@mui/material/Box";
import { useTimer } from "react-timer-hook";
import CircularStatic from "./CircularProgress";

const CircularProgress = ({ timeout, onComplete }) =>
{
    const expiryTimestamp = new Date();
    expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + timeout);
    const {
        totalSeconds,
        seconds,
    } = useTimer({ expiryTimestamp, onExpire: () => onComplete() });

    return (
        <Box sx={LOCAL_STYLES.container}>
            <CircularStatic
                isSummary
                progress={Number.isFinite(seconds) ? seconds : 0}
                value={totalSeconds}
            />
        </Box>
    );
};

export default CircularProgress

const LOCAL_STYLES = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "48px",
        height: "48px",
    }
};