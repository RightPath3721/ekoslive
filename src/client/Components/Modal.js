import React from "react";
import { Modal } from "@mui/material";

const CustomizedModal = ({ open, close }) =>
{
    return (
        <Modal
            open={open}
            style={{ justifyContent: "center", borderWidth: 2, borderColor: "white" }}
            onClose={close}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        />
    );
}

export default CustomizedModal;