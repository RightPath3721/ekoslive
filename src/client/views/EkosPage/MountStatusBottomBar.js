import React from "react";
import { useSelector } from "react-redux";
import { Grid, Typography } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { toAZ, toDMS, toHA } from "@common/shared/common/common";
import {
	selectPierSide,
	selectMountAz,
	selectMountAt,
	selectMountHa,
} from "@redux/selectors";

const PierSides = ["west", "east"];
const toPierSideText = (pierSide) =>
{
	if (pierSide < 0 || pierSide > 1) return "";
	else return s.ekos.collapse_mount[PierSides[pierSide]];
};

const MountText = ({ title, marginLeft = "0px", color }) =>
{
	return (
		<Typography sx={{ color: color, marginLeft: marginLeft, fontSize: "1rem" }}>
			{title}
		</Typography>
	);
};

const MountStatusBottomBar = () =>
{
	const ekosRunning = useSelector((state) => state.ekos.connection.online);
	const pierSide = useSelector(selectPierSide);
	const az = useSelector(selectMountAz);
	const at = useSelector(selectMountAt);
	const ha = useSelector(selectMountHa);

	if (!ekosRunning)
	{
		return (
			<Typography sx={[{ fontSize: "16px" }]}>
				{s.status.information_ekos_offline}
			</Typography>
		);
	}

	return (
		<Grid
			container
			sx={[
				{
					display: "flex",
					paddingInline: "10px",
					justifyContent: "space-between",
					width: "50%",
					borderRight: `1px solid ${Palette.grey33}`,
				},
			]}
		>
			<Grid item sx={styles.center}>
				<MountText color={Palette.orange} title={s.ekos.mount_status_bar.az} />
				<MountText marginLeft="6px" title={toAZ(az)} />
			</Grid>
			<Grid item sx={styles.center}>
				<MountText color={Palette.orange} title={s.ekos.mount_status_bar.at} />
				<MountText marginLeft="6px" title={toDMS(at)} />
			</Grid>
			{ha !== undefined && (
				<Grid item sx={[styles.center]}>
					<MountText
						color={Palette.orange}
						title={s.ekos.mount_status_bar.ha}
					/>
					<MountText marginLeft="6px" title={toHA(ha)} />
				</Grid>
			)}
			<Grid item sx={styles.center}>
				<MountText
					color={Palette.orange}
					title={s.ekos.collapse_mount.pierside}
				/>
				<MountText marginLeft="6px" title={toPierSideText(pierSide)} />
			</Grid>
		</Grid>
	);
};

export default MountStatusBottomBar;
