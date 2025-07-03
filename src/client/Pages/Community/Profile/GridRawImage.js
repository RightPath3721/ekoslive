import React, { forwardRef, Suspense, useState } from "react";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Image from "mui-image";
import TabLoader from "@components/TabLoader";

const ViewRawImage = React.lazy(() => import("./ViewRawImage"));

const GridRawImage = forwardRef(({ item }, ref) =>
{
	const [isFullViewOpen, setIsFullViewOpen] = useState(false);

	return (
		<>
			<Grid
				ref={ref}
				item
				sx={{
					width: "100%",
					aspectRatio: 1,
					borderRadius: "8px",
					overflow: "hidden",
					transition: "transform .2s ease-in-out, opacity .2s ease-in-out",
					":hover": {
						transform: "scale(1.05)",
						opacity: ".8",
					},
					objectFit: "contain",
				}}
			>
				<Button
					onClick={() => setIsFullViewOpen(true)}
					sx={{
						padding: 0,
						width: "100%",
						height: "100%",
					}}
				>
					<Image
						src={item?.shortURL}
						width="100%"
						height="100%"
						duration={0.5}
						fit="fill"
						alt={item?.metadata?.filename ?? ""}
						sx={{
							objectFit: "contain",
						}}
					/>
				</Button>
			</Grid>

			<Suspense fallback={<TabLoader />}>
				{isFullViewOpen && (
					<ViewRawImage
						image={item}
						onClose={() => setIsFullViewOpen(false)}
						open
					/>
				)}
			</Suspense>
		</>
	);
});

export default GridRawImage;
