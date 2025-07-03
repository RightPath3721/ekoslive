import { Palette } from "@common/shared/common/styles";
import { Box, Grid, Typography } from "@mui/material";
import { isEmpty } from "lodash";
import React from "react";
import Icon from "./Icon";
import { useDispatch } from "react-redux";
import { ekosActions } from "@redux/actions";

const LogView = ({ module, log }) =>
{
	const dispatch = useDispatch();
	return (
		<Grid>
			<Grid
				sx={{
					overflowY: "scroll",
					height: "50vh",
					marginTop: "20px",
					justifyContent: "center",
					"::-webkit-scrollbar": {
						height: "4px",
					},
					"::-webkit-scrollbar-track": {
						WebkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
					},
					"::-webkit-scrollbar-thumb": {
						backgroundColor: "rgba(0,0,0,.1)",
						outline: `1px solid ${Palette.grey44}`,
					},
				}}
			>
				<Box sx={{ position: "absolute", right: "60px" }}>
					<Icon
						onClick={() =>
							dispatch(ekosActions.invokeMethod(module, "clearLog"))
						}
						color={"#CECECE"}
						size="32px"
						name={"clear"}
					/>
				</Box>
				<Typography>
					{!isEmpty(log) &&
						log.split("\n").map((line, index) => (
							<span key={index}>
								{line}
								<br />
							</span>
						))}
				</Typography>
			</Grid>
		</Grid>
	);
};

export default LogView;
