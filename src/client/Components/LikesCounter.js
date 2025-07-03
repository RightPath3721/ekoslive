import React from "react";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";
import { styles } from "../shared/styles";

const LikesCounter = ({ count, liked, toggleLike }) =>
{
    return (
        <Button onClick={toggleLike} sx={[styles.center, { gap: ".375rem" }]}>
            <FavoriteBorderIcon
                style={{ color: liked ? Palette.orange : Palette.greyee }}
            />
            <Typography component="span">{count}</Typography>
        </Button>
    );
};

export default LikesCounter;
