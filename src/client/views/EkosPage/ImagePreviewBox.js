import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { styles } from "../../shared/styles";
import FullScreenImagePreview from "../../Components/FullScreenImagePreview";

const ImagePreviewBox = ({ src, title }) =>
{
    const [showFullImage, setShowFullImage] = useState(false);
    const toggle = () => setShowFullImage(prevValue => !prevValue);

    return (
        <Box sx={{ background: "#1d1d1d", borderRadius: "8px", cursor: "pointer", }} onClick={() => showFullImage ? null : toggle()}>
            <Typography sx={[styles.text, styles.center, { padding: "6px", opacity: 0.5, position: "relative" }]}>
                {title}
                <FullscreenIcon sx={{ color: "white", fontSize: 15, position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)" }} />
            </Typography>
            <img style={LOCAL_STYLES.image} src={src} />

            <FullScreenImagePreview src={src} close={toggle} open={showFullImage} />
        </Box>
    )
};

const LOCAL_STYLES = {
    image: {
        width: "100%",
        overflow: "hidden",
    },
};

export default ImagePreviewBox