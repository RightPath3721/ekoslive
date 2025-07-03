import { Box, Button, Grid, Typography } from "@mui/material";
import { isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { captureActions, wssMediaSocketActions } from "@redux/actions";
import SliderComponent from "../../Components/Slider";
import
{
    selectLiveStackingSettings,
    selectCaptureStatus,
    selectLiveStacking,
    selectPreviewPreset,
    selectCaptureSettings,
    selectCameras,
    selectLiveStackingTarget,
    selectMountTarget,
} from "@redux/selectors";

const LiveStacking = () => 
{
    const dispatch = useDispatch();
    const settings = useSelector(selectLiveStackingSettings, isEqual);
    const captureStatus = useSelector(selectCaptureStatus);
    const liveStacking = useSelector(selectLiveStacking);
    const previewPreset = useSelector(selectPreviewPreset);
    const captureSettings = useSelector(selectCaptureSettings);
    const activeCamera = useSelector(selectCameras);
    const liveStackingTarget = useSelector(selectLiveStackingTarget);
    const target = useSelector(selectMountTarget);

    const [looping, setLooping] = useState(false);

    useEffect(() =>
    {
        // If target changed while we are livestacking
        // we need to abort.
        if (liveStacking && !isEmpty(liveStackingTarget) && target !== liveStackingTarget)
        {
            dispatch(captureActions.toggleLiveStacker(false, target));
            // TODO add translation
            // dispatch({
            //     type: commands.NEW_NOTIFICATION,
            //     payload: {severity: 1, uuid: "livestacking", message: "Livestacking aborted due to target switch."}
            // });
            if (looping)
            {
                setLooping(settings.dark);
                dispatch(captureActions.stop());
            }
        }
    }, [target]);
    /**
     * Start capture looping. This is required in case there is no ongoing capture process.
     * So we start livestacking and then loop immediately afterwards.
     */
    const loop = () =>
    {
        setLooping(true);
        let payload = previewPreset;
        if (previewPreset.camera !== "--" || !isEmpty(previewPreset.camera))
        {
            // to avoid setting temperature to 0 (since "--" for some reason does that)
            if (payload.temperature === "--")
                delete payload.temperature;
            payload.dark = settings.dark;
            dispatch(captureActions.loop(payload))
        }
        else
        {
            payload = captureSettings;
            payload.dark = settings.dark;
            dispatch(captureActions.loop(payload))
        }
    };

    /**
     * Toggle on/off livestacking.
     * Start: We send options first, then toggle livestacking, then toggle looping if no capture process is going on.
     * Stop: We toggle livestacking, then stop looping IF we started it here before.
     */
    const toggleLiveStacking = () =>
    {
        // If we are starting live stacking, let's set the options
        // remember this is a TOGGLE
        if (!liveStacking)
        {
            dispatch(captureActions.setLivestackingSettings(settings));
            dispatch(wssMediaSocketActions.clearLiveStacking());
        }
        dispatch(captureActions.toggleLiveStacker(!liveStacking, target));

        // If there is no capture nor streaming going on, start looping.
        // TODO need to perhaps start looping with dark-subtracted images enabled.
        if (!liveStacking)
        {
            if ((captureStatus === "Idle" || captureStatus === "Aborted" || captureStatus === "Complete"))
            {
                // If we are streaming, stop this first.
                if (activeCamera && activeCamera.isStreaming())
                    dispatch(captureActions.stop());

                loop();
            }

        }
        // If we started looping due to livetacking, let's stop it.
        else if (looping)
        {
            setLooping(settings.dark);
            dispatch(captureActions.stop());
        }

    }

    /**
     * If capture status was changed (capture --> stopped) then we should stop livestacking along with it.
     */
    useEffect(() =>
    {
        if (captureStatus === "Idle" && liveStacking)
            dispatch(captureActions.toggleLiveStacker(!liveStacking));
    }, [captureStatus]);

    return (
        <Grid container sx={{ position: "absolute", bottom: "50px", backgroundColor: "rgba(0,0,0,0.2)", display: "flex", height: "20vh", width: "60vh" }}>
            <Grid item>
                <Typography style={{ color: "white" }}>Sigma Clipping</Typography>

                <SliderComponent
                    min={1}
                    max={10}
                    step={1}
                    value={settings.sigmaLower}

                    onChange={(e) =>
                    {
                        dispatch(captureActions.setLivestackingSettings({
                            ...settings,
                            sigmaLower: e.target.value
                        }));
                    }}
                />
                <SliderComponent
                    min={1}
                    max={10}
                    step={1}
                    value={settings.sigmaUpper}
                    onChange={(e) =>
                    {
                        dispatch(captureActions.setLivestackingSettings({
                            ...settings,
                            sigmaUpper: e.target.value
                        }));
                    }}
                />
            </Grid>
            <Grid item>
                <Box>
                    <Typography style={{ color: "white" }}>Contrast</Typography>
                    <SliderComponent
                        min={0}
                        max={100}
                        step={10}
                        value={settings.contrast}
                        onChange={(e) =>
                        {
                            dispatch(captureActions.setLivestackingSettings({
                                ...settings,
                                contrast: e.target.value
                            }));
                        }}
                    />
                </Box>
                <Box>
                    <Typography style={{ color: "white" }}>Saturation</Typography>
                    <SliderComponent
                        min={0}
                        max={100}
                        step={10}
                        value={settings.saturation}
                        onChange={(e) =>
                        {
                            dispatch(captureActions.setLivestackingSettings({
                                ...settings,
                                saturation: e.target.value
                            }));
                        }}
                    />
                </Box>
                <Box>
                    <Typography style={{ color: "white" }}>Background</Typography>
                    <SliderComponent
                        min={0}
                        max={100}
                        step={10}
                        value={settings.background}
                        onChange={(e) =>
                        {
                            dispatch(captureActions.setLivestackingSettings({
                                ...settings,
                                background: e.target.value
                            }));
                        }}
                    />
                </Box>
            </Grid>
            <Button
                onClick={toggleLiveStacking}
            ><Typography>{liveStacking ? "Stop" : "Start"}</Typography></Button>
            <Button>Gallery</Button>
        </Grid>
    )
}

export default LiveStacking;