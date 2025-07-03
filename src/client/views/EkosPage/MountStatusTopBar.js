import React from "react";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { useSelector } from "react-redux";
import { Grid, Typography } from "@mui/material";
import Barbadge from "../../Components/Barbadge";
import Icon from "../../Components/Icon";
import s from "@common/shared/i18n/i18n";
import { toDMS, toHMS } from "@common/shared/common/common";
import {
	selectMountStatus,
	selectMountTarget,
	selectMountRa,
	selectMountDe,
} from "@redux/selectors";

const LOCAL_STYLES = {
	text: {
		fontSize: "1rem",
	},
	row: {
		justifyContent: "center",
		flexDirection: "row",
		alignItems: "center",
	},
	infoBarContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		height: "38px",
		backgroundColor: Palette.grey11,
		borderTopWidth: 1,
		borderTopColor: "#333",
	},
	textStyle: {
		fontSize: "1rem",
		marginLeft: "6px",
	},
};

const MountStatusTopBar = () =>
{
	const ekosRunning = useSelector((state) => state.ekos.connection.online);
	const status = useSelector(selectMountStatus);
	const target = useSelector(selectMountTarget);

	const ra = useSelector(selectMountRa);
	const de = useSelector(selectMountDe);

	if (!ekosRunning)
		return (
			<Typography sx={[[LOCAL_STYLES.text], { padding: "5px" }]}>
				{s.status.information_ekos_offline}
			</Typography>
		);

	return (
		<Grid
			container
			sx={[
				styles.row,
				{
					justifyContent: "space-between",
					paddingInline: "10px",
					borderRight: `1px solid ${Palette.grey33}`,
				},
			]}
		>
			<Grid item sx={styles.center}>
				<Barbadge style={{ width: "80px" }}>{status}</Barbadge>
			</Grid>

			<Grid item sx={[styles.center]}>
				<Icon name="Flag" color="#ff6600" size="20px" />
				<Typography sx={LOCAL_STYLES.textStyle}>
					{target.substring(0, 16) || "None"}
				</Typography>
			</Grid>

			<Grid item sx={[styles.center]}>
				<Typography sx={[styles.text, { color: Palette.orange }]}>
					{s.ekos.mount_status_bar.ra}
				</Typography>
				<Typography sx={[LOCAL_STYLES.textStyle]}>{toHMS(ra)}</Typography>
			</Grid>

			<Grid item sx={[styles.center]}>
				<Typography sx={[styles.text, { color: Palette.orange }]}>
					{s.ekos.mount_status_bar.de}
				</Typography>
				<Typography sx={[LOCAL_STYLES.textStyle]}>{toDMS(de)}</Typography>
			</Grid>
		</Grid>
	);
};

export default MountStatusTopBar;
