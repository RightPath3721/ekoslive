import React from "react";
import Typography from "@mui/material/Typography";
import Image from "mui-image";
import Box from "@mui/material/Box";
import { Palette } from "@common/shared/common/styles";

const ObservatoryBox = ({
	name,
	photo = "/public/observatory_img_placeholder.webp",
	connected,
}) =>
{
	return (
		<>
			<Typography component="span" sx={{ color: "white", fontSize: "14px" }}>
				{name}
			</Typography>
			<Box sx={{ position: "relative" }}>
				<Typography
					sx={{
						position: "absolute",
						top: ".25rem",
						left: ".25rem",
						display: "block",
						width: "1rem",
						height: "1rem",
						borderRadius: "50%",
						backgroundColor: connected ? Palette.darkGreen : Palette.darkRed,
						zIndex: 1,
					}}
					component="span"
				/>
				<Image
					duration={0.3}
					src={photo}
					alt={`observatory preview for ${name}`}
					width={120}
					height={120}
				/>
			</Box>
		</>
	);
};

export default ObservatoryBox;
