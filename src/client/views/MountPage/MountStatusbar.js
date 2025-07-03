import { Grid, Typography } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { toDMS, toHMS } from "@common/shared/common/common";
import {
	selectMountStatus,
	selectMountTarget,
	selectMountRa,
	selectMountDe,
} from "@redux/selectors";
import { Palette } from "@indi/styles";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import Barbadge from "../../Components/Barbadge";
import Icon from "../../Components/Icon";

const LOCAL_STYLES = {
	textStyle: {
		color: Palette.grey66,
		fontSize: "16px",
		marginLeft: "16px",
	},
};
const MountStatusbar = () =>
{
	const status = useSelector(selectMountStatus);
	const target = useSelector(selectMountTarget);
	const ra = useSelector(selectMountRa);
	const de = useSelector(selectMountDe);

	return (
		<Grid
			container
			spacing={1}
			sx={[styles.row, { padding: "4px", justifyContent: "space-evenly" }]}
		>
			<Grid item sx={styles.center}>
				<Barbadge style={{ width: "110px" }}>{status}</Barbadge>
			</Grid>

			<Grid item sx={[styles.center]}>
				<Icon name="Flag" color="#ff6600" />
				<Typography sx={LOCAL_STYLES.textStyle}>
					{" "}
					{target.substring(0, 16) || "None"}
				</Typography>
			</Grid>

			<Grid item sx={[styles.center]}>
				<Typography sx={[styles.text, { color: Palette.orange }]}>
					{s.ekos.mount_status_bar.ra}
				</Typography>
				<Typography sx={[LOCAL_STYLES.textStyle]}> {toHMS(ra)}</Typography>
			</Grid>

			<Grid item sx={[styles.center]}>
				<Typography
					sx={[styles.text, { color: Palette.orange, fontSize: "16px" }]}
				>
					{s.ekos.mount_status_bar.de}
				</Typography>
				<Typography sx={[LOCAL_STYLES.textStyle]}> {toDMS(de)}</Typography>
			</Grid>
		</Grid>
	);
};

export default MountStatusbar;
