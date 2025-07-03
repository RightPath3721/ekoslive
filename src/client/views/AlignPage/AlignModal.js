import React, { useEffect, useState } from "react";
import { get, isEmpty } from "lodash";
import { Box, IconButton, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import EditIcon from '@mui/icons-material/Edit';
import s from "@common/shared/i18n/i18n";
import { alignActions, opticalTrainActions } from "@redux/actions";
import Dropdown from "../../Components/Dropdown";
import { numericControls } from "@indi/enums";
import NumericControl from "../../Components/NumericControl";
import CustomizedSwitch from "../../Components/CustomSwitch";
import { trainModules, DEVICE_TYPE } from "@indi/enums";
import
{
    selectAlignSettings,
    selectTargetAlignSettings,
    selectTrains,
    selectTrainName,
    selectTrainDevice,
} from "@redux/selectors";

const Actions = [
    {
        text: "action_sync",
        value: 0,
    },
    {
        text: "action_slew",
        value: 1,
    },
    {
        text: "action_nothing",
        value: 2,
    },
];

const AlignModal = ({ toggleOpticalTrain }) =>
{
    const dispatch = useDispatch();

    const alignSettings = useSelector(selectAlignSettings);
    const [activeSettings, setActiveSettings] = useState({
        name: "",
        exp: isEmpty(alignSettings) ? 1 : alignSettings.alignExposure,
        bin: isEmpty(alignSettings) ? "1x1" : alignSettings.alignBinning,
        iso: isEmpty(alignSettings) ? "" : alignSettings.alignISO,
        gain: isEmpty(alignSettings) ? "--" : alignSettings.alignGain,
        filter: isEmpty(alignSettings) ? "--" : alignSettings.alignFilter,
        dark: isEmpty(alignSettings) ? "--" : alignSettings.alignDarkFrame,
        accuracy: isEmpty(alignSettings) ? "--" : alignSettings.alignAccuracyThreshold,
        settle: isEmpty(alignSettings) ? "--" : alignSettings.alignSettlingTime,
        profile: isEmpty(alignSettings) ? "1-Default" : alignSettings.kcfg_SolveOptionsProfile,
        solverIndex: 0
    });

    const targetAlignSettings = useSelector(selectTargetAlignSettings);

    const allTrains = useSelector(selectTrains);
    const activeTrain = useSelector((state) => selectTrainName(state, { trainType: trainModules.AlignOpticalTrain }));

    const activeCamera = useSelector(state => selectTrainDevice(state, {
        trainType: trainModules.AlignOpticalTrain,
        deviceType: DEVICE_TYPE.CAMERA,
    }));
    const { exp, bin, filter, gain, accuracy, settle, dark, iso, profile } = activeSettings;

    const setSolverAction = (val) => 
    {
        let payload = {}
        // get value from the store
        if (val === undefined || val === null)
            val = get(targetAlignSettings, "solverAction", 1);
        else if (val === 0)
            payload = { syncR: true };
        else if (val === 1)
            payload = { slewR: true };
        else if (val === 2)
            payload = { nothingR: true };

        dispatch(alignActions.setAllSettings(payload));
    }

    useEffect(() => 
    {
        const payload = {
            alignBinning: bin,
            alignExposure: exp,
            alignFilter: filter,
            alignGain: gain,
            alignAccuracyThreshold: accuracy,
            alignSettlingTime: settle,
            alignDarkFrame: dark,
            alignISO: iso,
            kcfg_SolveOptionsProfile: profile,
        };
        dispatch(alignActions.setAllSettings(payload));

    }, [exp, bin, filter, gain, settle, accuracy, iso, dark, profile])

    return (
        <Box sx={{
            position: "absolute",
            left: "calc(100% + 1px)",
            top: "52%",
            transform: "translateY(-50%)",
            backgroundColor: "rgb(16, 16, 16)",
            padding: "18px 12px",
            display: "flex",
            gap: "12px",
            flexDirection: "column",
            borderRadius: "4px",
        }}>
            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white" }}>{s.general.train}</Typography>
                <Dropdown
                    options={allTrains}
                    value={activeTrain}
                    onChange={(e) =>
                    {
                        let payload = {
                            name: e.value,
                            module: "align",
                        };
                        dispatch(opticalTrainActions.setTrain(payload));
                        dispatch(opticalTrainActions.getAllTrains());
                    }}
                />
                <IconButton
                    onClick={toggleOpticalTrain}
                    sx={[LOCAL_STYLES.imageButton, { backgroundColor: "#FFFCFA1A", borderRadius: "4px" }]}
                >
                    <EditIcon sx={{ color: "#CECECE", fontSize: 25 }} />
                </IconButton>
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white" }}>{s.general.exposure}</Typography>
                <NumericControl
                    device={activeCamera}
                    type={numericControls.EXPOSURE}
                    onChange={(value) =>
                    {
                        setActiveSettings({ ...activeSettings, exp: value });
                    }}
                    initialValue={activeSettings?.exp}
                />
            </Box>

            {get(activeCamera, "hasGain", false) && (
                <Box sx={[LOCAL_STYLES.gridItem]}>
                    <Typography sx={{ color: "white" }}>{s.general.gain}</Typography>
                    <NumericControl
                        device={activeCamera}
                        type={numericControls.GAIN}
                        onChange={(value) =>
                        {
                            setActiveSettings({ ...activeSettings, gain: value });
                        }}
                        initialValue={activeSettings?.gain}
                    />
                </Box>
            )}

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white" }}>{s.general.action}</Typography>
                <CustomizedSwitch
                    options={Actions.map(({ text, value }) => ({
                        label: s.ekos.collapse_align[text],
                        value,
                    }))}
                    fontSize="12px"
                    onChange={(value) =>
                    {
                        // save value to the store
                        dispatch(alignActions.saveTargetAlignSettings({ solverAction: value }));
                        // send payload to EKOS
                        setSolverAction(value);
                    }}
                    value={get(targetAlignSettings, "solverAction", 1)}
                />
            </Box>

            <Box sx={[LOCAL_STYLES.gridItem]}>
                <Typography sx={{ color: "white" }}>{s.general.binning}</Typography>
                <CustomizedSwitch
                    options={[
                        { label: "1x1", value: "1x1" },
                        { label: "2x2", value: "2x2" },
                        { label: "3x3", value: "3x3" },
                        { label: "4x4", value: "4x4" }
                    ]}
                    onChange={value => setActiveSettings({ ...activeSettings, bin: value })}
                    value={activeSettings?.bin}
                />
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
    imageButton: { width: '36px', height: "36px", minWidth: "auto", padding: 0 }
}

export default AlignModal