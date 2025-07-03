import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material";
import { useMediaQuery } from "react-responsive";
import SliderPanel from "./SliderPanel";

const LargeScreenPanel = ({ children }) =>
{
	const { palette } = useTheme();
	const [headerHeight, setHeaderHeight] = useState(90);

	useEffect(() =>
	{
		const resizeObserver = new ResizeObserver((entries) =>
		{
			const headerEntry = entries[0];
			if (!headerEntry) return;

			const headerHeight = headerEntry.borderBoxSize?.[0]?.blockSize;

			if (headerHeight)
			{
				setHeaderHeight(headerHeight);
			}
		});
		const header = document.querySelector("header");

		if (header)
		{
			resizeObserver.observe(header);
		}

		return () =>
		{
			if (header)
			{
				resizeObserver.unobserve(header);
			}
		};
	}, []);

	return (
		<Box
			id="side-panel"
			component="aside"
			sx={{
				backgroundColor: palette.black[700],
				position: "relative",
				width: "clamp(120px, calc(100vw / 6), 320px)",
			}}
		>
			<Box
				sx={{
					position: "sticky",
					top: headerHeight,
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					gap: "1rem",
					marginTop: { xxs: ".25rem", lg: "5rem", "2xl": "5rem" },
					paddingInline: "1.5rem",
					paddingTop: "1rem",
					paddingBottom: "1rem",
					width: "inherit",
					height: `calc(100vh - ${headerHeight}px)`,
					overflow: "auto",
					"@media (max-height: 800px)": {
						height: `calc(100vh - ${headerHeight}px)`,
						overflow: "visible",
						display: "flex",
						flexDirection: "column",
					},
				}}
			>
				{children}
			</Box>
		</Box>
	);
};

const SidePanelContainer = ({ children }) =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });

	return isLargeScreen ? (
		<LargeScreenPanel>{children}</LargeScreenPanel>
	) : (
		<SliderPanel>{children}</SliderPanel>
	);
};

export default SidePanelContainer;
