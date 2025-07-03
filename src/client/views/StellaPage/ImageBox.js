import React, { useState } from "react";
import { isEmpty } from "lodash";
import Image from "mui-image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";
import { styles } from "../../shared/styles";
import FullScreenImagePreview from "../../Components/FullScreenImagePreview";

const BadgeView = ({ bgColor, data = "N/A" }) => (
    <Box sx={[styles.center, {
        backgroundColor: bgColor, borderRadius: "25px",
        width: "35px",
        height: "25px",
    }]}>
        <Typography sx={[styles.text, { fontSize: "12px" }]}>{data}</Typography>
    </Box>
);

const ImageBox = ({ image }) =>
{
    const [showFullImage, setShowFullImage] = useState(false);
    const { filter, exptime, xbinning, ybinning } = image.metadata;

    return (
        <Box sx={{ position: "relative", justifySelf: "center", width: "fit-content", height: "fit-content" }}>
            <Image
                duration={2} onClick={() => setShowFullImage(true)}
                style={{ width: "150px", height: "120px", cursor: "pointer" }} src={image.preview} />
            <Box sx={[styles.row, {
                flexDirection: "row",
                marginTop: "5px",
                justifyContent: "space-evenly",
                width: "150px",
            }]}>
                {!isEmpty(filter) && <BadgeView data={filter.length > 3 ? (filter.toUpperCase()).substring(0, 3) : filter.toUpperCase()} bgColor={Palette.red} />}
                <BadgeView data={exptime?.toFixed(1)} bgColor={Palette.orange} />
                <BadgeView data={`${xbinning}x${ybinning}`} bgColor={Palette.grey44} />
            </Box>
            <FullScreenImagePreview src={image.preview} open={showFullImage} close={() => setShowFullImage(false)} metadata={image.metadata} />
        </Box>
    )
}

export default ImageBox