import React from "react";
import { get, isEmpty } from "lodash";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";
import { positionAngleToRotation } from "@common/shared/common/common";

const FOVOverlay = ({ fovData, fovWidth, fovHeight, imageWidth, imageHeight, translation, fullscreen }) =>
{
    const fontSize = (fullscreen ? "20px" : "14px");
    const rotation = fovData.pa !== undefined ? { rotate: `${360 - positionAngleToRotation(fovData.pa)}deg` } : { rotate: '0deg' };
    const x = isEmpty(translation) ? { translateX: 0 } : { translateX: translation.x };
    const y = isEmpty(translation) ? { translateY: 0 } : { translateY: translation.y };

    const overSized = (fovData.fovW > fovWidth || fovData.fovH > fovHeight);
    return <Box sx={[LOCAL_STYLES.container, { width: imageWidth, height: imageHeight }]}>
        <Box sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            // calculates the width and height from the fov profile data and fov width from metadata
            width: imageWidth * Math.min(1, fovData.fovW / fovWidth),
            height: imageHeight * Math.min(1, (fovData.fovH / fovHeight)),
            border: `1px solid ${overSized ? Palette.yellow : Palette.green}`,
            opacity: 0.7,
            borderBottom: `1px solid ${Palette.orange}`,
            transform: `translate(calc(-50% + ${x.translateX}px), calc(-50% + ${y.translateY}px)) rotate(${rotation.rotate})`,
        }} />
        <Typography
            sx={[LOCAL_STYLES.sensorFOVText, { fontSize }]}>{fovData.fovW.toFixed(1)}'x{fovData.fovH.toFixed(1)}'</Typography>

        <Typography sx={[LOCAL_STYLES.sensorRotationText, { fontSize }]}>{get(fovData, "pa", 0).toFixed(0)}° E of
            N</Typography>

        <Typography
            sx={[LOCAL_STYLES.frameFOVText, { fontSize }]}>{fovWidth.toFixed(1)}'x{fovHeight.toFixed(1)}'</Typography>
    </Box>
}

const LOCAL_STYLES = {
    container: {
        position: "absolute",
        zIndex: 2,
    },
    frameFOVText: {
        fontSize: "12px",
        color: Palette.white70,
        position: "absolute",
        left: "5px",
        bottom: 0
    },
    sensorFOVText: {
        fontSize: "12px",
        color: Palette.orange,
        position: "absolute",
        left: "5px",
        top: 0
    },
    sensorRotationText: {
        fontSize: "12px",
        color: Palette.orange,
        position: "absolute",
        right: "5px",
    }
};

export default FOVOverlay;
