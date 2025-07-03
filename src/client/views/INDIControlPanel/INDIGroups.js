import React, { memo } from "react";
import { Box, Button } from "@mui/material";
import { Palette } from "@common/shared/common/styles";

const INDIGroups = ({ selectedGroup, setSelectedGroupName, deviceGroups, handleGroupUnsubscribe }) =>
    <Box sx={{
        display: "grid",
        gridTemplate: "repeat(auto-fill, 40px) / repeat(6, auto)",
        gap: "6px",
    }}>
        {deviceGroups.map((group) => groupTab(group, selectedGroup, setSelectedGroupName, handleGroupUnsubscribe))}
    </Box>

const groupTab = (name, selectedGroup, setSelectedGroupName, handleGroupUnsubscribe) =>
    <Button
        sx={{
            paddingInline: "10px",
            backgroundColor: name === selectedGroup ? Palette.orange : Palette.grey44,
            fontSize: "12px",
            textTransform: "none",
            color:  Palette.white,
        }}
        onClick={() =>
        {
            if (selectedGroup !== name)
            {
                // if there was a previously selected group, unsubscribe first
                handleGroupUnsubscribe();
                setSelectedGroupName(name);
            }
        }}
        key={name}>
        {name}
    </Button>

export default memo(INDIGroups);
