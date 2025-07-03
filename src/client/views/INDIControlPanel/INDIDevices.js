import React, { memo } from "react";
import { Palette } from "@common/shared/common/styles";
import { Box, Button } from "@mui/material";

const INDIDevices = ({ devices, selectedDeviceName, setActiveDevice, handleGroupUnsubscribe }) =>
{
    return (<Box style={{
        display: "flex",
        flexDirection: "row",
        gap: "6px"
    }}>
        {devices.map((device) => deviceTab(device, selectedDeviceName, setActiveDevice, handleGroupUnsubscribe))}
    </Box>)
}

const deviceTab = (name, selectedDeviceName, setActiveDevice, handleGroupUnsubscribe) =>
    <Button
        style={{
            backgroundColor: name === selectedDeviceName ? Palette.orange : Palette.grey44,
            color: "white",
            fontSize: "14px",
            minWidth: "fit-content",
            textTransform: "none",
        }}
        onClick={() =>
        {
            // runs only if a different tab is selected
            if (selectedDeviceName !== name)
            {
                handleGroupUnsubscribe();
                setActiveDevice(name);
            }
        }}
        key={name}>
        {name}
    </Button>

export default memo(INDIDevices);
