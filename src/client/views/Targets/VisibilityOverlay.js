import React, { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Image from "mui-image";
import Icon from "../../Components/Icon";
import { fractionToHM, range360 } from "@common/shared/common/common";
import { selectAlmanac } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import icons from "./icons";

const lunarPhaseName = (illum, phase) =>
{
	phase = range360(phase);
	//First, handle the major phases
	if (illum > 0.99) return s.targets.phases.full_moon;
	if (illum < 0.01) return s.targets.phases.new_moon;

	if (Math.abs(illum - 0.5) < 0.06)
	{
		if (phase < 180.0) return s.targets.phases.first_quarter;
		else return s.targets.phases.third_quarter;
	}

	//Next, handle the more general cases
	if (phase < 90.0) return s.targets.phases.waxing_crescent;
	else if (phase < 180.0) return s.targets.phases.waxing_gibbous;
	else if (phase < 270.0) return s.targets.phases.waning_gibbous;
	else if (phase < 360.0) return s.targets.phases.waning_crescent;
	else return "unknown";
};

const VisibilityOverlay = ({
	showVisibilityOverlay,
	setShowVisibilityOverlay,
}) =>
{
	// Ekos Alamac data
	const almanac = useSelector(selectAlmanac, isEqual);
	const [moonImage, setMoonImage] = useState("moon00");
	const [dawn, setDawn] = useState("--:--");
	const [dusk, setDusk] = useState("--:--");
	const [phaseName, setPhaseName] = useState("");

	/**
	 * Update Lunar image when almanac is updated.
	 */
	useEffect(() =>
	{
		if (almanac)
		{
			// iPhase must be in [0,36) range
			const phase = (0.1 * range360(almanac.MoonPhase) + 0.5).toFixed() % 36;
			const moonFilename = "moon" + phase.toString().padStart(2, "0");
			setMoonImage(moonFilename);

			const dawn = fractionToHM(almanac.Dawn, true);
			setDawn(dawn);

			const dusk = fractionToHM(almanac.Dusk);
			setDusk(dusk);

			setPhaseName(lunarPhaseName(almanac.MoonIllum, almanac.MoonPhase));
		}
	}, [almanac]);

	return (
		<Modal
			open={showVisibilityOverlay}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
			onClose={() => setShowVisibilityOverlay(false)}
		>
			{/* Moon/Sun visibility Widget */}
			<Box sx={[styles.centerAbsolute, LOCAL_STYLES.modal]}>
				{/* Moon */}
				<Box sx={[styles.row]}>
					<Image
						duration={0}
						width="150px"
						height="150px"
						src={icons[moonImage]}
					/>
					<Box sx={{ padding: "36px" }}>
						<Typography sx={[styles.row, LOCAL_STYLES.textRow]}>
							<Icon size={25} color={Palette.white70} name="north-east" />
							<Typography sx={LOCAL_STYLES.subheader} component="span">
								{almanac ? fractionToHM(almanac.MoonRise) : null}
							</Typography>
							<Icon size={25} color={Palette.white70} name="south-east" />
							<Typography sx={LOCAL_STYLES.subheader} component="span">
								{almanac ? fractionToHM(almanac.MoonSet) : null}
							</Typography>
						</Typography>

						<Typography sx={[styles.row, LOCAL_STYLES.textRow]}>
							<Icon size={25} color={Palette.white70} name="wb-sunny" />
							<Typography sx={LOCAL_STYLES.lunarHeader} component="span">
								{almanac
									? (almanac.MoonIllum * 100).toFixed(0) + "% " + phaseName
									: null}
							</Typography>
						</Typography>
					</Box>
				</Box>
				{/* Sun */}
				<Box sx={[styles.row]}>
					<Image width="150px" height="150px" duration={0} src={icons.sun} />
					<Box sx={{ padding: "36px" }}>
						<Typography sx={[styles.row, LOCAL_STYLES.textRow]}>
							<Icon size={25} color={Palette.white70} name="south-east" />
							<Typography sx={LOCAL_STYLES.subheader} component="span">
								{almanac ? fractionToHM(almanac.SunSet) : null}
							</Typography>
							<Icon size={25} color={Palette.white70} name="north-east" />
							<Typography sx={LOCAL_STYLES.subheader} component="span">
								{almanac ? fractionToHM(almanac.SunRise) : null}
							</Typography>
						</Typography>

						<Typography sx={[styles.row, LOCAL_STYLES.textRow]}>
							<Icon size={25} color={Palette.white70} name="nightlight-round" />
							<Typography sx={LOCAL_STYLES.subheader} component="span">
								{almanac ? dusk : null}
							</Typography>
							<Icon size={25} color={Palette.white70} name="wb-sunny" />
							<Typography sx={LOCAL_STYLES.subheader} component="span">
								{almanac ? dawn : null}
							</Typography>
						</Typography>
					</Box>
				</Box>
			</Box>
		</Modal>
	);
};

export default VisibilityOverlay;

const LOCAL_STYLES = {
	modal: {
		backgroundColor: "black",
		borderRadius: "10px",
		padding: "24px",
		width: "fit-content",
	},
	lunarHeader: {
		fontSize: "14px",
		color: Palette.white70,
	},
	subheader: {
		color: Palette.white70,
	},
	textRow: {
		alignItems: "center",
		gap: "4px",
	},
};
