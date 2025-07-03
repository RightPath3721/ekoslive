import React from "react";
import { Box, Button, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";

const Refresh = ({ refresh }) => (
	<Box sx={[{ display: "flex" }]}>
		<Button
			onClick={refresh}
			sx={{
				backgroundColor: Palette.orange,
				height: "40px",
				width: "120px",
				"&:hover": { backgroundColor: Palette.orange },
			}}
		>
			<RefreshIcon
				style={{ fill: "#0000008a", margin: "12px" }}
				fontSize="small"
				color="white"
			/>
			<Typography
				sx={[styles.text, { textTransform: "none", fontSize: "15px" }]}
			>
				{s.general.refresh}
			</Typography>
		</Button>
	</Box>
);

export default Refresh;
