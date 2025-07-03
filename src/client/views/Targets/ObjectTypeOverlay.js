import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Image from "mui-image";
import React from "react";
import { Palette } from "@common/shared/common/styles";
import { objectTypes } from "@indi/enums";
import asteroidImg from "@images/objects/asteroids.webp";
import galaxiesImg from "@images/objects/galaxies.webp";
import gaseousnebulaeImg from "@images/objects/gaseousnebulae.webp";
import globularclustersImg from "@images/objects/globularclusters.webp";
import openclustersImg from "@images/objects/openclusters.webp";
import planetarynebulaeImg from "@images/objects/planetarynebulae.webp";
import planetsImg from "@images/objects/planets.webp";
import starsImg from "@images/objects/stars.webp";
import supernovaeImg from "@images/objects/supernovae.webp";
import cometsImg from "@images/objects/comets.webp";

const images = {
	Asteroids: asteroidImg,
	Galaxies: galaxiesImg,
	"Gaseous Nebulae": gaseousnebulaeImg,
	"Globular Clusters": globularclustersImg,
	"Open Clusters": openclustersImg,
	"Planetary Nebulae": planetarynebulaeImg,
	Planets: planetsImg,
	Stars: starsImg,
	Supernovae: supernovaeImg,
	Comets: cometsImg,
};

const ObjectTypeOverlay = ({
	setFilterSettings,
	objectType,
	showTargetTypeOverlay,
	setShowTargetTypeOverlay,
	filterSettings,
}) =>
{
	return (
		<Modal
			open={showTargetTypeOverlay}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(5, 1fr)",
					backgroundColor: "rgba(0,0,0,0.7)",
					columnGap: "10px",
					rowGap: "40px",
					padding: "40px",
					justifyItems: "center",
					alignItems: "center",
					justifyContent: "center",
					alignContent: "center",
					width: "95%",
					height: "100%",
				}}
			>
				{Object.keys(objectTypes).map((objectTypeName, index) => (
					<Button
						onClick={() =>
						{
							setFilterSettings({
								...filterSettings,
								objectType: objectTypeName,
							});
							setShowTargetTypeOverlay(false);
						}}
						sx={{
							width: "200px",
							display: "flex",
							flexDirection: "column",
							gap: "10px",
							alignItems: "center",
							justifyContent: "center",
							padding: 0,
							height: "fit-content",
						}}
						key={index}
					>
						<Image
							sx={[
								objectType === objectTypeName
									? LOCAL_STYLES.activeImage
									: LOCAL_STYLES.inactiveImage,
							]}
							width="200px"
							height="200px"
							duration={0}
							src={images[objectTypeName]}
						/>
						<Typography
							sx={[
								objectType === objectTypeName
									? LOCAL_STYLES.activeBtn
									: LOCAL_STYLES.inactiveBtn,
								{
									color: "white",
									fontSize: "17px",
									padding: "6px 4px",
									borderRadius: "4px",
								},
							]}
						>
							{objectTypeName}
						</Typography>
					</Button>
				))}
			</Box>
		</Modal>
	);
};

export default ObjectTypeOverlay;

const LOCAL_STYLES = {
	activeBtn: {
		backgroundColor: Palette.orange,
		borderWidth: "1px",
		width: "100%",
	},
	inactiveBtn: {
		borderWidth: "1px",
		width: "100%",
		backgroundColor: "black",
	},
	activeImage: {
		width: "200px",
		height: "200px",
		borderRadius: "5px",
		borderColor: Palette.orange,
		borderWidth: "2px",
	},
	inactiveImage: {
		width: "200px",
		height: "200px",
		borderRadius: "5px",
	},
};
