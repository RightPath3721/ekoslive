import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import CloseButton from "./CloseButton";
import { styles } from "../shared/styles";
import { ekosliveServer } from "../config";
import { selectUser } from "@redux/selectors";
import functionTools from "@common/shared/common/functionTools"
import StellaFilterInput from "./StellaFilterInput";
import StellaFilterInputTooltip from "./StellaFilterInputTooltip";

const StellaFilterInputModal = ({
    open,
    close,
    setDisplayList,
    setMatchedImages,
    mode,
}) =>
{
    const user = useSelector(selectUser);
    const [prompt, setPrompt] = useState("");

    const handleFilter = useCallback(async () =>
    {
        try
        {
            if (!user) return null;
            const url = `/api/stella/aiFilter?username=${encodeURIComponent(user.username)}&token=${user.token}`;
            const response = await ekosliveServer.post(url, { value: prompt });
            const { function_name, function_args } = response.data;
            let filteredData = await toast.promise(
                functionTools(function_name, function_args),
                { pending: "Stella is analyzing..." }
            );
            if (setDisplayList)
            {
                setDisplayList(filteredData ?? []);
            }
            if (setMatchedImages)
            {
                setMatchedImages(filteredData ?? []);
            }
            filteredData?.length > 0
                ? toast.success("Stella has found some interesting objects!✅")
                : toast.info(
                    "Stella didn't find anything this time. Could you try widening your search criteria or adjusting the filters?"
                );
            close();
        } catch (error)
        {
            console.error(error);
            toast.error(
                "There was a problem with the filtering process. Please try again❌"
            );
        }
    }, [setMatchedImages, setDisplayList, prompt]);

    return (
        <Modal open={open} onClose={close}>
            <Box
                sx={[
                    styles.centerAbsolute,
                    styles.center,
                    { top: "20%", background: "transparent", width: "100%", gap: "12px" },
                ]}
            >
                <StellaFilterInput
                    submitPrompt={handleFilter}
                    prompt={prompt}
                    setPrompt={setPrompt}
                />

                <StellaFilterInputTooltip mode={mode} />

                <CloseButton
                    onChange={close}
                    right="10%"
                    sx={{
                        top: "auto",
                        bottom: "50%",
                    }}
                />
            </Box>
        </Modal>
    );
};

export default StellaFilterInputModal;
