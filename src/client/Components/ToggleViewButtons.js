import React from "react";
import { useTheme } from "@mui/material";
import { useMediaQuery } from "react-responsive";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import GridViewIcon from "@client/icons/GridViewIcon";
import ListViewIcon from "@client/icons/ListViewIcon";

const ToggleViewButtons = ({ toggleView, view }) =>
{
	const isMediumScreen = useMediaQuery({ query: "(min-width: 480px)" });
	const { palette } = useTheme();

	const iconSize = isMediumScreen ? 24 : 18;
	return (
		<Box
			sx={{
				display: "flex",
				gap: { xxs: ".375rem", xs: ".75rem" },
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<IconButton
				id="gridView"
				onClick={toggleView}
				sx={{
					width: { xxs: "28px", xs: "38px" },
					height: { xxs: "28px", xs: "38px" },
					borderRadius: "6px",
					padding: { xxs: ".25rem", xs: ".375rem" },
					backgroundColor: `${view === "grid" ? palette.primary.main : palette.common.white}1F`,
				}}
			>
				<GridViewIcon
					color={view === "grid" ? palette.primary.main : "#CECECE"}
					width={iconSize}
					height={iconSize}
				/>
			</IconButton>
			<IconButton
				id="listView"
				onClick={toggleView}
				sx={{
					width: { xxs: "28px", xs: "38px" },
					height: { xxs: "28px", xs: "38px" },
					padding: { xxs: ".25rem", xs: ".375rem" },
					borderRadius: "6px",
					backgroundColor: `${view !== "grid" ? palette.primary.main : palette.common.white}1F`,
				}}
			>
				<ListViewIcon
					color={view !== "grid" ? palette.primary.main : "#CECECE"}
					width={iconSize}
					height={iconSize}
				/>
			</IconButton>
		</Box>
	);
};

export default ToggleViewButtons;
