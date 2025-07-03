import { Box, Button, Typography } from "@mui/material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ekosActions } from "@redux/actions";
import { settingsConstants } from "@redux/constants";
import api from "@common/shared/utils/api";
import Dropdown from "../../Components/Dropdown";
import { selectDeviceIP, selectCameras, elementAttributeSelector } from "@redux/selectors";

const RecordingSettings = () => 
{
    const dispatch = useDispatch();

    const [recordingDuration, setRecordingDuration] = useState("Until Stopped");
    const ip = useSelector(selectDeviceIP);

    const camera = useSelector(selectCameras);
    const [fpsExposure, setFpsExposure] = useState(10);

    const isRecordingOff = useSelector(state => elementAttributeSelector(state,
        {
            device: camera?.name,
            property: "RECORD_STREAM",
            element: "RECORD_OFF",
            attribute: "state"
        }));

    const isStreamingOn = useSelector(state => elementAttributeSelector(state,
        {
            device: camera?.name,
            property: "CCD_VIDEO_STREAM",
            element: "STREAM_ON",
            attribute: "state"
        }));

    const toggleStreaming = async () =>
    {
        try
        {
            // Toggle Streaming ON
            if (!isStreamingOn)
            {
                const result = await api.startStreamer(ip, camera?.name);
                if (result)
                {
                    dispatch(camera.setStreamingEncoder(true));
                    dispatch(camera.setStreamingLimits(512, 10));
                    dispatch(ekosActions.setProperty("Camera:" + camera?.name, "StreamingEnabled", false, dispatch));
                    dispatch({type: ekosConstants.GET_ECHO_DATA, data: {type: achievementsConstants.VIDEO_RECORDING_ACHIEVED, payload: {}}});
                    // delay for few seconds, so the server is completed loaded
                    setTimeout(()=> dispatch({type: settingsConstants.OVERRIDE_CAPTURE_STATUS, payload: "Streaming"}), 2000);
                }
            }
            // Toggle it OFF
            else
            {
                dispatch(camera.setStreamingEncoder(false));
                await api.stopStreamer(ip);
                dispatch(ekosActions.setProperty("Camera:" + camera?.name, "StreamingEnabled", true));
                dispatch({type: settingsConstants.OVERRIDE_CAPTURE_STATUS, payload: "Idle"});
            }
            dispatch(camera.setStreamingEnabled(!isStreamingOn));
        }
        catch (error)
        {
            const message = "Failed to toggle stream: " + JSON.stringify(error);
            console.log(message)
            // const ts = +new Date();
            // dispatch({type: notificationConstants.ADD_NOTIFICATION, payload: {message, uuid: ts, severity: 1, ts}});
        }
    }

    return(
        <Box sx={{position: "absolute", bottom: "50px", backgroundColor: "rgba(0,0,0,0.2)", display: "flex", height: "20vh", width: "60vh"}}>
        <Box style={{display: "flex", flexDirection: "row"}}>
        <Dropdown
            // recording times from 1 to 180 seconds
            options={
                [
                    {text: "Until Stopped"}
                ]
                    .concat(
                        [0.1, 0.5, 1, 2, 3, 5, 10, 15, 20, 30, 60, 120, 180, 300, 600, 1200].map(item => ({
                            label: `${item}s`,
                            value: item
                        }))
                    )
            }
            value={Number.isInteger(recordingDuration) ? `${recordingDuration}s` : recordingDuration}
            onChange={(e) =>
            {
                if (e.label === "Until Stopped")
                {
                    setRecordingDuration(e.label);
                }
                else
                {
                    setRecordingDuration(Number(e.value));
                    dispatch(camera.setRecordingOptions(Number(e.value)));
                }
            }}
        />
        <Dropdown
            options={
                [1, 10, 20, 30, 60].map(item => ({label: `${item} FPS`, value: item}))
            }
            value={`${fpsExposure} FPS`}
            disabled={!isRecordingOff}
            onChange={ e =>
            {
                if (e.value !== fpsExposure)
                {
                    // rounding to six decimal places
                    const exposureSeconds = (1 / (e.value));
                    setFpsExposure(e.value);
                    dispatch(camera.setStreamingExposure(exposureSeconds));
                    // If streaming was on, let's restart it.
                    if (isStreamingOn)
                    {
                        dispatch(camera.setStreamingEnabled(false));
                        setTimeout(function ()
                        {
                            dispatch(camera.setStreamingEnabled(true));
                        }, 6000);
                    }
                }
            }}
            />
        <Button onClick={toggleStreaming}>
            {/* stop button (for until stopped) without timer */}
                            {isStreamingOn ? 
                <Typography>Stop</Typography>
                                : <Typography>Play</Typography>}
        </Button>
        <Button>Stop</Button>
        </Box>
        </Box>
    )
}

export default RecordingSettings;