import React, { memo, useState } from "react";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AssignmentIcon from '@mui/icons-material/Assignment';
import { useDispatch, useSelector } from "react-redux";
import { selectCaptureLog, selectSchedulerLog } from "@redux/selectors";
import { Palette } from "@common/shared/common/styles";
import { ekosActions } from "@redux/actions";
import Icon from "../../Components/Icon";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";

const LogButton = ({ module }) =>
{
    const dispatch = useDispatch();
    const [showLog, setShowLog] = useState(false);
    const log = useSelector(module === "Capture" ? selectCaptureLog : selectSchedulerLog);

    const onClick = () =>
    {
        dispatch(ekosActions.invokeMethod(module, "clearLog"));
        setShowLog(false);
    };

    return (
        <Box sx={{ position: "relative" }}>
            <IconButton
                onClick={() => setShowLog(prevValue => !prevValue)}
                sx={[LOCAL_STYLES.btn, { backgroundColor: showLog ? "#FF66001F" : "#FFFCFA1F", }]}
            >
                <AssignmentIcon sx={{ color: "#CECECE", fontSize: 20 }} />
            </IconButton>
            {showLog && (
                <Box sx={[styles.verticalScrollBar, LOCAL_STYLES.log, {
                    transform: module === "Capture" ? log ? "translate(-70%, 30%)" : "translate(-70%, 200%)" :
                        log ? "translate(-50%, 30%)" : "translate(-50%, 190%)"
                },
                log ? null : {
                    width: "380px",
                    alignItems: "center",
                }]}>
                    {log ? <>
                        <IconButton
                            sx={[LOCAL_STYLES.logClearButton]}
                            onClick={onClick}
                        >
                            <Icon name="Close" color={Palette.white} size={16} />
                        </IconButton>
                        <Typography
                            sx={{
                                color: Palette.white70, fontSize: 12,
                            }}
                        >
                            {log}
                        </Typography>
                    </> : <Typography sx={{ color: Palette.white70, fontSize: 12, }}>{s.general.no_data_found}</Typography>}
                </Box>
            )
            }
        </Box >
    )
}

const LOCAL_STYLES = {
    log: {
        position: "absolute",
        top: 0,
        left: "-50%",
        width: "400px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        borderColor: "#666666",
        backgroundColor: "#1d1d1d",
        padding: "6px",
        maxHeight: "200px",
        overflowY: "scroll",
    },
    logClearButton:
    {
        position: "sticky",
        top: 0,
        backgroundColor: Palette.orange,
        borderRadius: "4px",
        padding: "4px",
    },
    btn: {
        padding: 0,
        minWidth: "auto",
        width: "38px",
        height: "38px",
        borderRadius: "4px",
    }
};

export default memo(LogButton)
