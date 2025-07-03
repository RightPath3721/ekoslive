import React from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Palette } from "@common/shared/common/styles";
import { styles } from "../shared/styles";

const BookmarksCounter = ({ count, togglePostInBookmarks, isSaved }) =>
{
    return (
        <Button
            onClick={togglePostInBookmarks}
            sx={[styles.center, { gap: ".375rem" }]}
        >
            <BookmarkIcon style={{ color: isSaved ? Palette.black : Palette.greyee }} />
            <Typography component="span">{count}</Typography>
        </Button>
    );
};

export default BookmarksCounter;
