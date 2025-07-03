import React from "react";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { Palette } from "@common/shared/common/styles";
import Button from "./Button";
import Icon from "./Icon";
import ProgressCircle from "./ProgressCircle";
import s from "@common/shared/i18n/i18n";
import { styles } from "../shared/styles";

/*
QMessageBox::NoIcon	0	the message box does not have any icon.
QMessageBox::Information	1	an icon indicating that the message is nothing out of the ordinary.
QMessageBox::Warning	2	an icon indicating that the message is a warning, but can be dealt with.
QMessageBox::Critical	3	an icon indicating that the message represents a critical problem.
QMessageBox::Question	4	an icon indicating that the message is asking a question.
*/

const QMessageBoxIcons = [
    null,
    { name: "info", color: Palette.green },
    { name: "warning", color: Palette.orange },
    { name: "error", color: Palette.error },
    { name: "help", color: Palette.blue }
];


const EkosDialog = ({ title, message, icon, buttons, handleButtonAction, handleTimeout, defaultButton, timeout }) =>
{
    const totalButtons = Array.isArray(buttons) ? buttons : 0;

    const iconComponent =
        icon > 0 && icon < 5 ?
            <Icon {...QMessageBoxIcons[icon]} size={48} /> : null;

    return (
        <Modal
            open
            sx={{ display: "grid", placeItems: "center" }}
            aria-labelledby="modal-notification"
            aria-describedby="modal-ekos-notification"
        >
            <Box sx={[LOCAL_STYLES.container]}>
                <Typography sx={[LOCAL_STYLES.title]}>{title}</Typography>
                <Box sx={[styles.row, { alignItems: "center", gap: "10px" }]}>
                    {iconComponent}
                    <Typography sx={[LOCAL_STYLES.messageStyle]}>{message}</Typography>
                </Box>
                {timeout ? (
                    <Box sx={[styles.row, LOCAL_STYLES.autoCloseContainer]}>
                        <Typography sx={[LOCAL_STYLES.autoCloseText, { color: Palette.grey99 }]}>{s.ekos.ekos_dialog.auto_closes_in}</Typography>
                        <ProgressCircle timeout={timeout}
                            onComplete={handleTimeout} />
                    </Box>
                ) : null}
                <Box sx={[styles.row, { gap: "16px" }]}>
                    {totalButtons
                        ? buttons.map((button) => (
                            <Button
                                key={button}
                                onClick={() => handleButtonAction(button)}
                                sx={{
                                    backgroundColor: defaultButton === button ? Palette.orange : "#FFFCFA1F",
                                    borderColor: defaultButton === button ? Palette.orange : Palette.grey11,
                                    color: Palette.greycc,
                                    position: "relative",
                                    left: 0,
                                    bottom: 0,
                                    width: "fit-content",
                                }}
                                text={button}
                            />
                        ))
                        : null}
                </Box>
            </Box>
        </Modal >
    );
}

export default EkosDialog;

const LOCAL_STYLES = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: "16px",
        backgroundColor: "rgb(16, 16, 16)",
        border: "1px solid #FFFCFA24",
        padding: "18px",
        borderRadius: "4px",
        margin: 0,
        boxSizing: "border-box",
        minWidth: "fit-content",
    },
    title: {
        fontSize: "20px",
        color: Palette.greycc,
    },
    messageStyle: {
        fontSize: "20px",
        color: Palette.greycc,
        maxWidth: "400px",
    },
    autoCloseContainer: {
        gap: "12px",
        alignItems: "center",
    },
    autoCloseText: {
        fontSize: "18px",
        color: Palette.grey99,
    }
};