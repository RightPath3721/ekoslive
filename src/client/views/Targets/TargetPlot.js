import Box from "@mui/material/Box";
import React, { useEffect, useRef, useState } from "react";
import AltVsTimeBackground from "./AltVsTimeBackground";
import Chart from "./Chart";
import CircularProgress from "@mui/material/CircularProgress";


const TargetPlot = ({ almanac, rise, datetime, observability, opacity }) =>
{
	if (!almanac || !rise || !datetime || !observability) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
				<CircularProgress size={24} />
			</Box>
		);

	}

	const boxRef = useRef(null);
	const [size, setSize] = useState({ width: 300, height: 200 });

	useEffect(() =>
	{
		if (boxRef.current)
		{
			const { width, height } = boxRef.current.getBoundingClientRect();
			setSize({ width: width - 17, height });
		}
	}, []);

	return (
		<Box
			ref={boxRef}
			sx={[
				LOCAL_STYLES.plotContainer,
				{ opacity: opacity, height: size.height },
			]}
		>
			<AltVsTimeBackground
				almanac={almanac}
				width={size.width}
				height={size.height}
			/>
			{rise && (
				<Box
					style={{
						zIndex: 10,
						position: "absolute",
					}}
				>
					<Chart
						altitudes={rise.altitudes}
						datetime={datetime}
						width={size.width}
						height={size.height}
						observability={observability}
						yMin={0}
					/>
				</Box>
			)}
		</Box>
	);
};

const LOCAL_STYLES = {
	plotContainer: {
		display: "flex",
		flex: 1,
		position: "relative",
	},
};

export default TargetPlot;
