import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CheckIcon from '@mui/icons-material/Check';
import EkosModal from "../../Components/EkosModal";
import DownloadButton from "../../Components/DownloadButton";
import CopyButton from "../../Components/CopyButton";
import XMLFormatter from "../../Components/XMLFormatter";
import FilenamePicker from "./FilenamePicker";
import { Palette } from "@common/shared/common/styles";

const XMLDialog = ({ xml, onClose }) =>
{
    const [copied, setCopied] = useState(false);
    const [showFilenamePicker, setShowFilenamePicker] = useState(false);

    const download = useCallback((filename) =>
    {
        let newFilename = filename;
        if (xml.includes("SequenceQueue"))
        {
            newFilename = filename.endsWith(".esq") ? filename : filename + ".esq";
        } else if (xml.includes("SchedulerList"))
        {
            newFilename = filename.endsWith(".esl") ? filename : filename + ".esl";
        }
        const blob = new Blob([xml], { type: "application/xml" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = newFilename;

        link.click();
        setShowFilenamePicker(false);
    }, []);

    useEffect(() =>
    {
        const handleBlur = () => setCopied(false);

        window.addEventListener("blur", handleBlur);

        return () =>
        {
            window.removeEventListener("blur", handleBlur);
        };
    }, []);

    return (
        <EkosModal initialValue={{ x: "30%", y: "10%" }} onClose={onClose} outsideClick={false}>
            <Box sx={{ position: "absolute", top: "4px", right: "40px", display: "flex", alignItems: "center", gap: "8px" }}>
                <DownloadButton
                    onClick={() => setShowFilenamePicker(true)}
                    size={24}
                    sx={LOCAL_STYLES.btn}
                />
                {copied ? <CheckIcon style={{ color: Palette.white, fontSize: 24 }} />
                    : <CopyButton
                        onClick={() =>
                        {
                            navigator.clipboard.writeText(xml);
                            setCopied(true);
                        }}
                        size={20}
                        sx={LOCAL_STYLES.btn}
                    />}
            </Box>
            <XMLFormatter xml={xml} />
            {showFilenamePicker && <FilenamePicker
                onClose={() => setShowFilenamePicker(false)}
                download={download} />}
        </EkosModal>
    )
};

const LOCAL_STYLES = {
    btn: {
        position: "static",
        width: "30px",
        height: "30px",
        borderRadius: "4px",
        backgroundColor: "#FFFCFA1F",
    }
};

export default XMLDialog