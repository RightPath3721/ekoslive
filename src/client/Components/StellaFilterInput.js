import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import AudioRecorder from "./AudioRecorder"
import { Palette } from "@common/shared/common/styles";
import
{
    selectUser
} from "@redux/selectors";
import { ekosliveServer } from "../config";

const StellaFilterInput = ({ submitPrompt, prompt, setPrompt }) =>
{
    const user = useSelector(selectUser);
    if (!user) {
        return (
            <form style={LOCAL_STYLES.formBox}>
                <Box sx={{
                    width: "100%",
                    position: "relative",
                    backgroundColor: "#FFFCFA4F",
                    borderRadius: "4px"
                }}>
                    <textarea 
                        style={LOCAL_STYLES.inputBoxStyles}
                        placeholder="Please log in to use Stella"
                        disabled
                    />
                </Box>
            </form>
        );
    }
    const [height, setHeight] = useState("40px");
    const inputRef = useRef(null);

    const audioRecorderRef = useRef(null);
    const autoRunRef = useRef(false);
    const [recording, setRecording] = useState(false);

    const handleSubmit = (e) =>
    {
        e.preventDefault();
        submitPrompt();
    };

    const handleAudioSave = async (audioBlob) =>
    {
        const formData = new FormData();
        formData.append('audio', audioBlob, "recording.mp3");
        setRecording(false);
        
        if (!user) return null;

        const url = `api/stella/speech_to_text?username=${encodeURIComponent(user.username)}&token=${user.token}`;

        try
        {

            const response = await ekosliveServer.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (autoRunRef.current)
            {
                setPrompt(response.data);
                await submitPrompt(response.data, null);
                autoRunRef.current = false;
            } else
            {
                setPrompt(response.data)
                autoRunRef.current = false;
            }
        } catch (error)
        {
            console.log("Upload error: ", error);
        }
    };

    useEffect(() =>
    {
        if (!inputRef.current) return null;
        setHeight(`${inputRef.current.scrollHeight}px`);
    }, [inputRef]);

    useEffect(() =>
    {
        if (autoRunRef.current && audioRecorderRef.current)
        {
            audioRecorderRef.current.stopRecording();
        }
    }, [recording]);

    return (
        <form style={LOCAL_STYLES.formBox} onSubmit={handleSubmit}>
            <Box
                sx={{
                    width: "100%",
                    position: "relative",
                    backgroundColor: "#FFFCFA4F",
                    borderRadius: "4px",
                }}
            >
                <label
                    style={{
                        position: "relative",
                        display: "block",
                        width: "100%",
                        height: "fit-content",
                    }}
                >
                    <textarea
                        ref={inputRef}
                        value={prompt}
                        style={{
                            height: prompt ? height : "40px",
                            ...LOCAL_STYLES.inputBoxStyles,
                        }}
                        onKeyDown={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
                        onChange={(e) =>
                        {
                            setPrompt(e.target.value);
                            setHeight(`${e.target.scrollHeight}px`);
                        }}
                        placeholder="Search with Stella"
                        name="prompt"
                        required
                        className="stella-input"
                    />
                    <Box sx={{
                        width: "120px",
                        position: "absolute",
                        top: "50%",
                        right: "45px",
                        transform: "translateY(-50%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "12px",
                        zIndex: 2,
                    }}>

                        <AudioRecorder ref={audioRecorderRef} onRecordingComplete={handleAudioSave} onStart={() => setRecording(true)} onStop={() => setRecording(false)} />

                        {recording ?
                            <IconButton sx={[LOCAL_STYLES.inputIconStyles, { right: "-35px" }]} onClick={(e) => {
                                e.preventDefault();
                                autoRunRef.current = true;
                                setRecording(false)
                            }}>
                                <SendIcon sx={{ color: Palette.red, fontSize: 20, animation: 'pulsate 1s infinite' }} />
                            </IconButton>
                            :
                            <IconButton sx={[LOCAL_STYLES.inputIconStyles, { right: "-35px" }]} type="submit">
                                <SendIcon sx={{ color: Palette.white, fontSize: 20 }} />
                            </IconButton>
                        }
                        <style jsx="true">{`
                        @keyframes pulsate {
                            0% {
                                transform: scale(1);
                                opacity: 1;
                            }
                            50% {
                                transform: scale(1.2);
                                opacity: 0.7;
                            }
                            100% {
                                transform: scale(1);
                                opacity: 1;
                            }
                        }
                    `}</style>
                    </Box>
                </label>
            </Box>
        </form>
    );
};

const LOCAL_STYLES = {
    formBox: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "10px",
        alignItems: "center",
        boxSizing: "border-box",
        width: "60%"
    },
    inputBoxStyles: {
        padding: "6px 60px 6px 6px",
        width: "100%",
        backgroundColor: "transparent",
        color: Palette.white,
        borderRadius: "4px",
        boxSizing: "border-box",
        alignContent: "center",
        overflow: "hidden",
        maxHeight: "200px",
    },
    inputIconStyles: {
        position: "absolute",
        top: "50%",
        right: "6px",
        transform: "translateY(-50%)",
        display: "grid",
        placeItems: "center",
        padding: 0,
    },
};

export default StellaFilterInput;
