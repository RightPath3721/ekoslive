import { Box, Button, Input, Modal, Typography } from "@mui/material";
import { get, isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { mountActions, targetsActions } from "@redux/actions";
import { toDMS, toHMS } from "@common/shared/common/common";
import {
	selectSelectedTarget,
	selectRecentlyUsedTargets,
} from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import SwitchToggle from "../../Components/Switch";
import { styles } from "../../shared/styles";
import ExternalSearch from "../Targets/ExternalSearch";

const MountText = ({ title }) =>
{
	return (
		<Typography sx={{ color: "white", width: "max-content" }}>
			{title}
		</Typography>
	);
};

const GotoSync = ({ open, close, isScheduler = false, setSettings }) =>
{
	const dispatch = useDispatch();

	const recentlyUsedTargets = useSelector(selectRecentlyUsedTargets);
	const selectedTarget = useSelector(selectSelectedTarget, isEqual);

	const [target, setTarget] = useState(
		!isEmpty(recentlyUsedTargets) ? recentlyUsedTargets[0] : "",
	);
	const [isJ2000, setIsJ2000] = useState(false);
	const [ra, setRA] = useState("");
	const [de, setDE] = useState("");

	const onSync = () =>
	{
		if (!isEmpty(ra) && !isEmpty(de)) dispatch(mountActions.syncTarget(target));
		else if (!isEmpty(target))
			dispatch(mountActions.syncRADE({ ra: ra, de: de }));

		close();
	};

	useEffect(() =>
	{
		setRA(toHMS(get(selectedTarget, "ra", 0) * 15));
		setDE(toDMS(get(selectedTarget, "de", 0)));
	}, [selectedTarget]);

	const onGoto = () =>
	{
		if (!isEmpty(ra) && !isEmpty(de))
			dispatch(mountActions.gotoRADE(ra, de, isJ2000));
		else if (!isEmpty(target)) dispatch(mountActions.gotoTarget(target));

		// since we can't modify props directly, we need to store the value in a local object
		let targets = recentlyUsedTargets;

		if (!targets.find((item) => item === target))
		{
			// we ensure that targets is always 10 or less
			// if its more or equal then remove the first item
			if (targets.length >= 10)
			{
				targets.shift();
			}
			// add newest target to the beginning
			targets.unshift(target);
		}

		dispatch(mountActions.saveRecentlyUsedTargets(targets));
		close();
	};

	const disabled = !(!isEmpty(target) || (!isEmpty(ra) && !isEmpty(de)));
	return (
		<Modal
			open={open}
			style={{ justifyContent: "center", borderWidth: 2, borderColor: "white" }}
			onClose={close}
			aria-labelledby="modal-modal-title"
			aria-describedby="modal-modal-description"
		>
			<Box sx={[styles.centerAbsolute, LOCAL_STYLES.modal]}>
				<Typography sx={{ margin: "0 auto", color: "white" }}>
					{isScheduler ? "Select Target" : s.ekos.modal_goto_sync.heading}
				</Typography>

				<Box sx={{ alignSelf: "center" }}>
					<ExternalSearch
						runExternalSearch={(selectedObjectName) =>
						{
							dispatch(
								targetsActions.getObjectInfo({
									object: selectedObjectName.toUpperCase(),
								}),
							);
							setTarget(selectedObjectName);
							if (isScheduler)
							{
								dispatch(
									targetsActions.getObjectInfo({
										object: selectedObjectName.toUpperCase(),
									}),
								);
								setSettings(
									toHMS(get(selectedTarget, "ra0", 0) * 15),
									toDMS(get(selectedTarget, "de0", 0)),
									selectedObjectName.toUpperCase(),
								);
								close();
							}
						}}
					/>
				</Box>

				{!isScheduler && (
					<Box style={{ marginTop: "25px" }}>
						<Typography
							style={{
								textAlign: "center",
								fontWeight: "bold",
								fontSize: "20px",
							}}
						>
							OR {s.ekos.collapse_mount.enter_coordinates}
						</Typography>
					</Box>
				)}
				{!isScheduler && (
					<Box
						sx={[
							LOCAL_STYLES.modalItem,
							{ display: "flex", justifyContent: "space-between", gap: "10px" },
						]}
					>
						<Box sx={[LOCAL_STYLES.modalInputBox]}>
							<MountText title={s.ekos.mount_status_bar.ra} />
							<Input
								sx={{ color: Palette.white70, backgroundColor: "#1d1d1d" }}
								value={`${ra || ""}`}
								placeholder="hh mm .."
								onChange={(e) =>
								{
									setRA(e.target.value);
								}}
								disableUnderline
							/>
						</Box>

						<Box sx={[LOCAL_STYLES.modalInputBox]}>
							<MountText title={s.ekos.mount_status_bar.de} />
							<Input
								sx={{ color: Palette.white70, backgroundColor: "#1d1d1d" }}
								value={`${de || ""}`}
								placeholder="dd mm .."
								onChange={(e) =>
								{
									setDE(e.target.value);
								}}
								disableUnderline
							/>
						</Box>
					</Box>
				)}

				{!isScheduler && (
					<SwitchToggle
						title={s.ekos.scheduler.j2000}
						value={isJ2000}
						onChange={(value) => setIsJ2000(value)}
					/>
				)}

				{!isScheduler && (
					<Box
						sx={[
							LOCAL_STYLES.modalItem,
							{ display: "flex", justifyContent: "space-around", gap: "10px" },
						]}
					>
						<Button
							sx={{ width: "30%", backgroundColor: "#1d1d1d" }}
							onClick={close}
						>
							<MountText title={s.general.cancel} />
						</Button>
						{isScheduler ? (
							<Button
								onClick={() =>
									{
									setSettings(ra, de, target);
									close();
								}}
								disabled={disabled}
								sx={{
									backgroundColor: Palette.blue,
									width: "30%",
									":disabled": { opacity: 0.6 },
								}}
							>
								<MountText title={s.general.select} />
							</Button>
						) : (
							<>
								<Button
									onClick={onSync}
									sx={{
										backgroundColor: Palette.blue,
										width: "100px",
										":disabled": { opacity: 0.6 },
									}}
									disabled={disabled}
								>
									<MountText title={s.ekos.collapse_align.action_sync} />
								</Button>

								<Button
									sx={{
										backgroundColor: Palette.orange,
										width: "100px",
										":disabled": { opacity: 0.6 },
									}}
									onClick={onGoto}
									disabled={disabled}
								>
									<MountText title={s.skymap.goto} />
								</Button>
							</>
						)}
					</Box>
				)}
			</Box>
		</Modal>
	);
};

const LOCAL_STYLES = {
	modal: {
		width: "max-content",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		gap: "16px",
		backgroundColor: "#111111",
		border: "2px solid #000",
		boxShadow: 24,
		p: 4,
	},
	modalItem: {
		display: "grid",
		gridTemplateColumns: "100px 1fr",
		flexDirection: "row",
		columnGap: "10px",
		alignItems: "center",
		width: "100%",
	},
	modalInputBox: {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
		gap: "10px",
	},
};

export default GotoSync;
