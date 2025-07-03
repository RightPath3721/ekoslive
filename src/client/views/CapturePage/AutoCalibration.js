import { Checkbox, Typography } from "@mui/material";
import { Box } from "@mui/system";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import { DMSToDouble, toDMS } from "@common/shared/common/common";
import { CalibrationPreActions, FlatDuration } from "@indi/enums";
import InputField from "../../Components/InputField";
import RadioButton from "../../Components/RadioButton";
import s from "@common/shared/i18n/i18n";
import NumericControl from "../../Components/NumericControl";
import { selectCalibrationSettings, selectTargetCalibrationSettings } from "@redux/selectors";

const CaptureText = ({ title }) => 
{
    return <Typography sx={{ color: "white", width: "max-content" }}>{title}</Typography>
};

const CaptureCheckBox = ({ title, checked, onChange }) =>
{
    return <Box sx={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "10px",
    }}>
        <Checkbox
            style={{ color: "white", padding: 0 }}
            checked={checked} onChange={onChange} />
        <CaptureText title={title} />
    </Box>
};

const CaptureInputBox = ({ title, clear, value, onChange, placeholder }) =>
{
    return <Box sx={{
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: "10px",
    }}>
        <CaptureText title={title} />
        <InputField
            clear={clear}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    </Box>
}

const AutoCalibration = () => 
{
    const dispatch = useDispatch();
    const calibrationSettings = useSelector(selectCalibrationSettings);
    const targetCalibrationSettings = useSelector(selectTargetCalibrationSettings);

    let initialSettings = {
        preAction: 0,
        source: 0,
        duration: 0,
        az: 0,
        al: 0,
        adu: 0,
        tolerance: 0,
        parkMount: false,
        parkDome: false
    }

    if (targetCalibrationSettings)
    {
        initialSettings = {
            preAction: targetCalibrationSettings.preAction,
            source: targetCalibrationSettings.source,
            duration: targetCalibrationSettings.duration,
            az: toDMS(targetCalibrationSettings.az),
            al: toDMS(targetCalibrationSettings.al),
            adu: targetCalibrationSettings.adu,
            tolerance: targetCalibrationSettings.tolerance,
            parkMount: targetCalibrationSettings.parkMount,
            parkDome: targetCalibrationSettings.parkDome,
        }
    } else if (calibrationSettings)
    {
        initialSettings = {
            preAction: calibrationSettings.preAction,
            source: calibrationSettings.source,
            duration: calibrationSettings.duration,
            az: toDMS(calibrationSettings.az),
            al: toDMS(calibrationSettings.al),
            adu: calibrationSettings.adu,
            tolerance: calibrationSettings.tolerance,
            parkMount: calibrationSettings.parkMount,
            parkDome: calibrationSettings.parkDome,
        }
    }

    const [preAction, setPreAction] = useState(initialSettings.preAction);
    // const [source, setSource] = useState(initialSettings.source);
    const source = initialSettings.source;
    const [duration, setDuration] = useState(initialSettings.duration);
    const [az, setAz] = useState(initialSettings.az);
    const [al, setAl] = useState(initialSettings.al);
    const [adu, setAdu] = useState(initialSettings.adu);
    const [tolerance, setTolerance] = useState(initialSettings.tolerance);
    // const [parkMount, setParkMount] = useState(initialSettings.parkMount);
    const parkMount = initialSettings.parkMount;
    // const [parkDome, setParkDome] = useState(initialSettings.parkDome);
    const parkDome = initialSettings.parkDome;

    const onSaveCalibrationSettings = (settings) =>
    {
        dispatch(captureActions.saveCalibrationSettings(settings));
    };

    const toggleAction = (action) =>
    {
        setPreAction(preAction ^ action);
    };

    /**TODO */
    const isActionSelected = (action) =>
    {
        return !!(preAction & action);
    };

    useEffect(() =>
    {
        onSaveCalibrationSettings({
            preAction: preAction,
            source: source,
            duration: duration,
            az: DMSToDouble(az),
            al: DMSToDouble(al),
            adu: parseInt(adu),
            tolerance: parseInt(tolerance),
            parkMount: parkMount,
            parkDome: parkDome
        });
    }, [source, duration, az, al, adu, tolerance, parkMount, parkDome, preAction]);

    return (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: "32px", paddingBlock: "6px" }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <CaptureText title={s.ekos.capture_auto_calibration.pre_actions} />
                <Box sx={{ display: "grid", gridTemplateColumns: "auto auto auto auto auto", alignItems: "center", gap: "10px" }}>
                    <CaptureCheckBox
                        checked={isActionSelected(CalibrationPreActions.ACTION_WALL)}
                        onChange={() => toggleAction(CalibrationPreActions.ACTION_WALL)}
                        title={s.ekos.capture_auto_calibration.wall}
                    />

                    <CaptureInputBox
                        title={s.ekos.capture_auto_calibration.az}
                        clear={() => setAz(0)}
                        value={`${az}`}
                        onChange={value => setAz(value)}
                        placeholder="dd mm ss.s"
                    />

                    <CaptureInputBox
                        title={s.ekos.targets_filters.alt}
                        clear={() => setAl(0)}
                        value={`${al || ""}`}
                        onChange={value => setAl(value)}
                        placeholder="dd mm ss.s"
                    />

                </Box>

                <CaptureCheckBox
                    title={s.ekos.capture_auto_calibration.park_mount}
                    checked={isActionSelected(CalibrationPreActions.ACTION_PARK_MOUNT)}
                    onChange={() => toggleAction(CalibrationPreActions.ACTION_PARK_MOUNT)}
                />

                <CaptureCheckBox
                    title={s.ekos.capture_auto_calibration.park_dome}
                    checked={isActionSelected(CalibrationPreActions.ACTION_PARK_DOME)}
                    onChange={() => toggleAction(CalibrationPreActions.ACTION_PARK_DOME)}
                />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <CaptureText title={s.ekos.capture_auto_calibration.flat_duration} />
                <RadioButton
                    value={duration}
                    data={[
                        {
                            label: "Manual",
                            handleChange: () => setDuration(FlatDuration.MANUAL),
                            value: duration === FlatDuration.MANUAL,
                        },
                    ]}
                />

                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: "80px 143px",
                    gap: "10px",
                    alignItems: "center"
                }}>
                    <RadioButton
                        value={duration}
                        data={[
                            {
                                label: s.ekos.capture_auto_calibration.adu,
                                handleChange: () => setDuration(FlatDuration.ADU),
                                value: duration === FlatDuration.ADU,
                            },
                        ]}
                    />
                    <NumericControl
                        initialValue={adu}
                        onChange={e => setAdu(e)}
                        customLimit={[0, 65535]}
                        steps={[1000, 1000]}
                    />
                </Box>

                <Box sx={{
                    display: "grid",
                    gridTemplateColumns: "80px 143px",
                    gap: "10px",
                    alignItems: "center"
                }}>
                    <CaptureText title={s.ekos.capture_auto_calibration.tolerance} />
                    <NumericControl
                        initialValue={tolerance}
                        onChange={e => setTolerance(e)}
                        customLimit={[0, 50000]}
                        steps={[100, 100]}
                    />
                </Box>
            </Box>
        </Box>
    )
}

// const LOCAL_STYLES = {}

export default AutoCalibration;