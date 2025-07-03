import React from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ModeCommentIcon from "@mui/icons-material/ModeComment";
import { Palette } from "@common/shared/common/styles";
import { styles } from "../shared/styles";

const CommentsCounter = ({ count, toggleCommentPopup }) =>
{
    return (
        <Button
            onClick={toggleCommentPopup}
            sx={[styles.center, { gap: ".375rem" }]}
        >
            <ModeCommentIcon style={{ color: Palette.greyee }} />
            <Typography component="span">{count}</Typography>
        </Button>
    );
};

export default CommentsCounter;
