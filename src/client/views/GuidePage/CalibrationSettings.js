import { Box, Checkbox, Typography } from "@mui/material";
import { get, isEmpty } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { guideActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import NumericControl from "../../Components/NumericControl";
import { selectGuideSettings } from "@redux/selectors";

const CalibrationSettings = () => 
{
    const dispatch = useDispatch();
    const guideSettings = useSelector(selectGuideSettings);
    const [state, setState] = useState({
        pulse: isEmpty(guideSettings) ? 0 : guideSettings.kcfg_CalibrationPulseDuration,
        max_move: isEmpty(guideSettings) ? 0 : guideSettings.kcfg_CalibrationMaxMove,
        max_iteration: get(guideSettings, "kcfg_AutoModeIterations", 0),
        two_axis: isEmpty(guideSettings) ? false : guideSettings.kcfg_TwoAxisEnabled,
        square_size: isEmpty(guideSettings) ? false : guideSettings.kcfg_GuideAutoSquareSizeEnabled,
        calibrationBacklash: isEmpty(guideSettings) ? false : guideSettings.kcfg_GuideCalibrationBacklash,
        resetCalibration: isEmpty(guideSettings) ? false : guideSettings.kcfg_ResetGuideCalibration,
        reuseCalibration: isEmpty(guideSettings) ? false : guideSettings.kcfg_ReuseGuideCalibration,
        reverseCalibration: isEmpty(guideSettings) ? false : guideSettings.kcfg_ReverseDecOnPierSideChange,

    });
    const checkBoxArray = [
        {
            text: s.ekos.collapse_align.calibration_settings.calibrate_backlast,
            checked: state.calibrationBacklash
        },
        {
            text: s.ekos.collapse_align.calibration_settings.reset_calibration,
            checked: state.resetCalibration
        },
        {
            text: s.ekos.collapse_align.calibration_settings.reuse_calibration,
            checked: state.reuseCalibration
        },
        {
            text: s.ekos.collapse_align.calibration_settings.reverse_calibration,
            checked: state.reverseCalibration
        }
    ];

    const {
        pulse,
        max_move,
        max_iteration,
        two_axis,
        square_size,
        calibrationBacklash,
        resetCalibration,
        reuseCalibration,
        reverseCalibration
    } = state

    useEffect(() =>
    {
        const payload = {
            kcfg_CalibrationPulseDuration: pulse,
            kcfg_CalibrationMaxMove: max_move,
            kcfg_AutoModeIterations: max_iteration,
            kcfg_TwoAxisEnabled: two_axis,
            kcfg_GuideAutoSquareSizeEnabled: square_size,
            kcfg_GuideCalibrationBacklash: calibrationBacklash,
            kcfg_ResetGuideCalibration: resetCalibration,
            kcfg_ReuseGuideCalibration: reuseCalibration,
            kcfg_ReverseDecOnPierSideChange: reverseCalibration
        }
        dispatch(guideActions.setAllSettings(payload));
    }, [state])
    return (
        <Box sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            justifyContent: "start",
            rowGap: "16px",
            columnGap: "32px",
            padding: "12px 0px",
            width: "max-content",
        }}>
            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white", width: "max-content" }}>{s.ekos.collapse_align.calibration_settings.pulse}</Typography>
                <NumericControl
                    initialValue={pulse}
                    onChange={(val) =>
                    {
                        setState({ ...state, pulse: val });
                    }}
                    steps={[100, 100]}
                    customLimit={[100, 5000]}
                />
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white", width: "max-content" }}>{s.ekos.collapse_align.calibration_settings.two_axis}</Typography>
                <Checkbox
                    style={{ color: "white", padding: 0 }}
                    checked={two_axis} onChange={() =>
                    {
                        setState({ ...state, two_axis: !two_axis })
                    }} />
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white" }}>{s.ekos.collapse_align.x_axis}</Typography>
                <NumericControl
                    initialValue={max_iteration}
                    onChange={(val) =>
                    {
                        setState({ ...state, max_iteration: val });
                    }}
                    steps={[1, 1]}
                    customLimit={[3, 10]}
                />
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white", width: "max-content" }}>{s.ekos.collapse_align.calibration_settings.square_size}</Typography>
                <Checkbox
                    style={{ color: "white", padding: 0 }}
                    checked={square_size} onChange={() =>
                    {
                        setState({ ...state, square_size: !square_size })
                    }} />
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white", width: "max-content" }}>{s.ekos.collapse_align.calibration_settings.max_move}</Typography>
                <NumericControl
                    initialValue={max_move}
                    onChange={(val) =>
                    {
                        setState({ ...state, max_move: val });
                    }}
                    steps={[1, 1]}
                    customLimit={[5, 100]}
                />
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem, { gridColumn: "span 2", display: "flex", flexDirection: "column", alignItems: "flex-start" }]}>
                {checkBoxArray.map((arr, index) =>
                {
                    return (
                        <Box sx={[LOCAL_STYLES.gridItem, { justifyContent: "flex-start", gap: "10px" }]} key={index}>
                            <Checkbox
                                style={{ color: "white", padding: 0 }}
                                checked={arr.checked} onChange={() =>
                                {
                                    if (index === 0)
                                        setState({ ...state, calibrationBacklash: !calibrationBacklash });
                                    else if (index === 1)
                                        setState({ ...state, resetCalibration: !resetCalibration });
                                    else if (index === 2)
                                        setState({ ...state, reuseCalibration: !reuseCalibration });
                                    else if (index === 3)
                                        setState({ ...state, reverseCalibration: !reverseCalibration });
                                }} />
                            <Typography sx={{ color: "white", width: "max-content" }}>{arr.text}</Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}

const LOCAL_STYLES = {
    gridItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
    },
}

export default CalibrationSettings;