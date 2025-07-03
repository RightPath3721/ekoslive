import React, { useState } from "react";
import { Global } from "@emotion/react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { useTheme } from "@mui/material";

const drawerBleeding = 40;

const SliderPanel = ({ children }) =>
{
	const [open, setOpen] = useState(false);
	const { palette } = useTheme();

	const toggleDrawer = (newOpen) => () =>
	{
		setOpen(newOpen);
	};

	return (
		<Stack sx={{ height: "100%", backgroundColor: `${palette.grey[300]}33` }}>
			<Global
				styles={{
					".MuiDrawer-root > .MuiPaper-root": {
						height: `calc(50% - ${drawerBleeding}px)`,
						overflow: "visible",
					},
				}}
			/>
			<SwipeableDrawer
				container={document.body}
				anchor="bottom"
				open={open}
				onClose={toggleDrawer(false)}
				onOpen={toggleDrawer(true)}
				swipeAreaWidth={drawerBleeding}
				disableSwipeToOpen={false}
				ModalProps={{
					keepMounted: true,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						top: -drawerBleeding,
						borderTopLeftRadius: 8,
						borderTopRightRadius: 8,
						visibility: "visible",
						right: 0,
						left: 0,
						backgroundColor: palette.black[600],
						width: "100%",
						height: "40px",
					}}
				>
					<Box
						sx={{
							width: "30px",
							height: "6px",
							backgroundColor: palette.grey.main,
							borderRadius: "4px",
							position: "absolute",
							top: "8px",
							left: "calc(50% - 15px)",
						}}
					/>
				</Box>
				<Box sx={{ padding: "1.25rem 1rem", height: "100%", overflow: "auto" }}>
					{children}
				</Box>
			</SwipeableDrawer>
		</Stack>
	);
};

export default SliderPanel;
