import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Box, Typography } from "@mui/material";
import BusyAnimationSection from "./BusyAnimation";

export default function CustomizedSwitch({
	options,
	onChange,
	value,
	disabled = false,
	fontSize = "14px",
	roundCorder = true,
	isBusy = false,
})
{
	const containerRef = React.useRef(null);

	// Inside your CustomSwitch component
	const [borderDimensions, setBorderDimensions] = React.useState({
		width: 200,
		height: 40,
		x: 0,
		y: 0,
	});

	// This replaces the onLayout function
	React.useEffect(() =>
	{
		if (!containerRef.current) return;

		const updateDimensions = () =>
		{
			if (!containerRef.current) return;
			
			const rect = containerRef.current.getBoundingClientRect();
			setBorderDimensions({
				width: rect.width,
				height: rect.height,
				x: rect.left,
				y: rect.top,
			});
		};

		// Initial measurement
		updateDimensions();

		// Add resize listener
		window.addEventListener("resize", updateDimensions);

		// Fix: Changed addEventListener to removeEventListener in cleanup
		return () =>
		{
			window.removeEventListener("resize", updateDimensions);
		};
	}, []); 
	
	return (
		<Box sx={{ position: "relative" }}>
			<ButtonGroup
				ref={containerRef} // Add ref here instead of onLayout
				variant="contained"
				aria-label="outlined primary button group"
				sx={{ gap: "8px", zIndex: 1000, boxShadow: "none" }}
			>
				{options.map((data, index) => (
					<Button
						key={index}
						// activeOpacity={1}
						onClick={() =>
						{
							onChange(data.value);
						}}
						disabled={disabled}
						style={{
							backgroundColor: data.value === value ? "#ff6600" : "#333333",
							borderRadius: roundCorder ? 25 : 0,
							border: 0,
							height: "43px",
						}}
					>
						<Typography sx={{ color: "white", fontSize: fontSize }}>
							{data?.label}
						</Typography>
					</Button>
				))}

				{isBusy && (
					<BusyAnimationSection
						isBusy={isBusy}
						borderDimensions={borderDimensions}
					/>
				)}
			</ButtonGroup>
		</Box>
	);
}
