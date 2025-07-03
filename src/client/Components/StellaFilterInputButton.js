import React, { useState } from "react";
import PsychologyIcon from "@mui/icons-material/Psychology";
import IconButton from "@mui/material/IconButton";
import StellaFilterInputModal from "./StellaFilterInputModal";

const StellaFilterInput = ({ setDisplayList = null, setMatchedImages = null, iconSize = 24, iconColor = "#FF6600", mode = "targets" }) =>
{
    const [showInputBox, setShowInputBox] = useState(false);

    return (
        <>
            <IconButton
                sx={{
                    padding: 0,
                    margin: 0,
                    background: "transparent",
                }}
                onClick={() => setShowInputBox(true)}
            >
                <PsychologyIcon sx={{ fontSize: iconSize, color: iconColor }} />
            </IconButton>
            <StellaFilterInputModal mode={mode} open={showInputBox} close={() => setShowInputBox(false)} setDisplayList={setDisplayList} setMatchedImages={setMatchedImages} />
        </>
    );
};

export default StellaFilterInput;
