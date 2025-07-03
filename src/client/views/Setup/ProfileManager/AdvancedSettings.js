import React, { useState } from "react";
import get from "lodash/get";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FilledInput from "@mui/material/FilledInput";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material";
import { styles } from "@client/shared/styles";
import CloseButton from "@components/CloseButton";
import s from "@common/shared/i18n/i18n";
import { ProfileGuidingArray, ProfileMode } from "@indi/enums";
import InfoIcon from "@client/icons/AcquisitionInfoIcon";
import RemoteTooltip from "./RemoteTooltip";
import Dropdown from "@components/Dropdown";

const AdvancedSettings = ({ setNewProfile, newProfile, close }) =>
{
	const { palette } = useTheme();

	const [advancedSettings, setAdvancedSettings] = useState({
		guiding: get(newProfile, "guiding", 0),
		mode: get(newProfile, "mode", "local"),
		remote_host: get(newProfile, "remote_host", ""),
		auto_connect: get(newProfile, "auto_connect", false),
		port_selector: get(newProfile, "port_selector", false),
		use_web_manager: get(newProfile, "use_web_manager", false),
		remote: get(newProfile, "remote", ""),
	});

	const {
		guiding,
		mode,
		remote_host,
		use_web_manager,
		remote,
		auto_connect,
		port_selector,
	} = advancedSettings;

	return (
		<Modal open onClose={close}>
			<Box
				sx={[
					styles.centerAbsolute,
					{
						padding: "1.5rem",
						backgroundColor: "rgba(0,0,0,0.9)",
						width: "60vw",
					},
				]}
			>
				<CloseButton onChange={close} right=".25rem" top=".25rem" />

				<Typography textAlign="center" component="h2" variant="h1">
					{s.ekos.collapse_guide.advanced}&nbsp;{s.settings.heading}
				</Typography>
				<Box
					sx={[
						{
							display: "grid",
							gridTemplateColumns: "repeat(2, 1fr)",
							marginTop: "1.5rem",
							gap: "1.5rem",
						},
					]}
				>
					<Box
						flexDirection="column"
						sx={[
							styles.center,
							{
								gap: "1rem",
								border: `1px solid #CECECE`,
								borderRadius: ".5rem",
								padding: ".5rem",
								alignItems: "flex-start",
							},
						]}
					>
						<Typography
							fontWeight={600}
							component="h4"
							variant="h2"
							color="primary"
							sx={{ width: "100%" }}
							textAlign="center"
						>
							{s.connect.add_profile.indi_server}
						</Typography>
						<Box
							sx={[
								{
									display: "grid",
									gridTemplateColumns: "80px 1fr",
									gap: "1rem",
									alignItems: "center",
									justifyContent: "flex-start",
								},
							]}
						>
							<Typography>{s.status.change_resolution_modal.mode}</Typography>

							<RadioGroup
								value={mode}
								onChange={(_, value) =>
								{
									setAdvancedSettings((prevSettings) => ({
										...prevSettings,
										mode: value,
									}));
									setNewProfile("mode", value);
								}}
								sx={[
									styles.center,
									{ flexDirection: "row", justifyContent: "space-between" },
								]}
							>
								<FormControlLabel
									value={ProfileMode.LOCAL}
									sx={{ gap: ".25rem" }}
									control={
										<Radio
											sx={{
												color: "common.white",
												opacity: 0.8,
												padding: 0,
												"&.Mui-Checked": { opacity: 1 },
											}}
										/>
									}
									label={s.connect.add_profile.local}
								/>
								<FormControlLabel
									value={ProfileMode.REMOTE}
									sx={{ gap: ".25rem" }}
									control={
										<Radio
											sx={{
												color: "common.white",
												opacity: 0.8,
												padding: 0,
												"&.Mui-Checked": { opacity: 1 },
											}}
										/>
									}
									label={s.general.remote}
								/>
							</RadioGroup>

							<FormControlLabel
								control={
									<Checkbox
										checked={use_web_manager}
										onChange={(_, value) =>
										{
											setAdvancedSettings((prevSettings) => ({
												...prevSettings,
												use_web_manager: value,
											}));
											setNewProfile("use_web_manager", !use_web_manager);
										}}
										disabled={mode === ProfileMode.LOCAL}
										sx={{
											"&.Mui-disabled": {
												color: "common.white",
											},
										}}
									/>
								}
								sx={{
									gridColumn: "1 / 3",
									"&.Mui-disabled": { opacity: 0.7 },
									"& .MuiFormControlLabel-label.Mui-disabled": {
										color: "common.white",
									},
								}}
								label={s.connect.add_profile.web_manager}
							/>

							<Typography>{s.connect.add_profile.host}</Typography>
							<FilledInput
								readOnly={mode !== ProfileMode.REMOTE}
								placeholder="localhost"
								onChange={(e) =>
								{
									const { value } = e.target;
									setAdvancedSettings((prevSettings) => ({
										...prevSettings,
										remote_host: value,
									}));
									setNewProfile("remote_host", value);
								}}
								value={remote_host}
							/>
						</Box>
					</Box>

					<Box
						flexDirection="column"
						sx={[
							styles.center,
							{
								gap: "1rem",
								width: "100%",
								border: `1px solid #CECECE`,
								borderRadius: ".5rem",
								padding: ".5rem",
								alignItems: "flex-start",
								justifyContent: "flex-start",
							},
						]}
					>
						<Typography
							fontWeight={600}
							component="h4"
							variant="h2"
							color="primary"
							textAlign="center"
							sx={{ width: "100%" }}
						>
							{s.connect.add_profile.profile_settings}
						</Typography>
						<FormControlLabel
							control={
								<Checkbox
									checked={auto_connect}
									onChange={(_, value) =>
									{
										setAdvancedSettings((prevSettings) => ({
											...prevSettings,
											auto_connect: value,
										}));
										setNewProfile("auto_connect", value);
									}}
								/>
							}
							sx={{
								gridColumn: "1 / 3",
							}}
							label={s.connect.add_profile.auto_connect}
						/>
						<FormControlLabel
							control={
								<Checkbox
									checked={port_selector}
									onChange={(_, value) =>
									{
										setAdvancedSettings((prevSettings) => ({
											...prevSettings,
											port_selector: value,
										}));
										setNewProfile("port_selector", value);
									}}
								/>
							}
							sx={{
								gridColumn: "1 / 3",
							}}
							label={s.connect.add_profile.port_selector}
						/>
					</Box>

					<Box
						flexDirection="column"
						sx={[
							styles.center,
							{
								gap: "1rem",
								gridColumn: "1 / 3",
								width: "100%",
								border: `1px solid #CECECE`,
								borderRadius: ".5rem",
								padding: ".5rem",
								alignItems: "flex-start",
							},
						]}
					>
						<Typography
							fontWeight={600}
							component="h4"
							variant="h2"
							color="primary"
							textAlign="center"
							sx={{ width: "100%" }}
						>
							{s.statuses.Guiding} & {s.connect.add_profile.remote_drivers}
						</Typography>
						<Box
							sx={[
								{
									display: "grid",
									gridTemplateColumns: "120px 1fr",
									gap: "1rem",
									alignItems: "center",
									justifyContent: "flex-start",
								},
							]}
						>
							<Typography>{s.statuses.Guiding}</Typography>
							<Dropdown
								label={ProfileGuidingArray[guiding]?.text ?? ""}
								onChange={(e) =>
								{
									setAdvancedSettings((prevSettings) => ({
										...prevSettings,
										guiding: e.value,
									}));
									setNewProfile("guiding", e.label);
								}}
								options={ProfileGuidingArray.map((item) => ({
									label: item.text,
									value: item.value,
								}))}
								value={guiding}
								width="100%"
							/>

							<Typography alignItems="center" display="inline-flex">
								{s.general.remote}
								<Tooltip
									title={<RemoteTooltip />}
									TransitionProps={{
										style: { backgroundColor: palette.common.black },
									}}
								>
									<Box ml=".25rem" component="span">
										<InfoIcon />
									</Box>
								</Tooltip>
							</Typography>

							<FilledInput
								placeholder="driver@host:port,driver@host,@host:port,@host,driver"
								onChange={(value) =>
								{
									setAdvancedSettings((prevSettings) => ({
										...prevSettings,
										remote: value,
									}));
									setNewProfile("remote", value);
								}}
								value={remote}
							/>
						</Box>
					</Box>
				</Box>
			</Box>
		</Modal>
	);
};

export default AdvancedSettings;
