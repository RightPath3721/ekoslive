import React, { useCallback, useState } from "react";
import { toast } from "react-toastify";
import isUndefined from "lodash/isUndefined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useDispatch, useSelector } from "react-redux";
import { captureException } from "@sentry/browser";
import { styles } from "@client/shared/styles";
import {
	selectConnectedKStarInstances,
	selectActiveKStarID,
} from "@redux/selectors";
import {
	setupActions,
	wssMessageSocketActions,
	wssMediaSocketActions,
} from "@redux/actions";
import { Palette } from "@common/shared/common/styles";
import commands from "@commands";
import ObservatoryBox from "@components/ObservatoryBox";
import ObservatoryLinkModal from "./ObservatoryLinkModal";
import useObservatoryAPI from "@hooks/useObservatoryAPI";
import s from "@common/shared/i18n/i18n";
import AlertDialog from "@components/AlertDialog";

const ObservatorySetupBox = ({
	observatory,
	setObservatories,
	isViewMode = false,
}) =>
{
	const dispatch = useDispatch();
	const activeKStarsIDS = useSelector(selectConnectedKStarInstances);
	const connectedKStarID = useSelector(selectActiveKStarID);
	const { postObservatoryData, deleteObservatory } = useObservatoryAPI(
		observatory?._id,
	);
	const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);
	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const isActive = !!activeKStarsIDS.find(
		(KStars) => KStars.machineID === observatory?.machine_id,
	);
	const [isLoading, setIsLoading] = useState(false);

	const closeLinkMenu = useCallback(
		() => setIsLinkMenuOpen(false),
		[setIsLinkMenuOpen],
	);

	const updateObservatory = useCallback(
		async (machine_id) =>
		{
			if (isUndefined(machine_id)) return;

			try
			{
				setIsLoading(true);
				const observatoryData = new FormData();
				observatoryData.append("machine_id", machine_id);
				const updatedObservatory = await postObservatoryData(
					observatoryData,
					"patch",
				);
				if (typeof updatedObservatory === "string")
				{
					toast.error(updatedObservatory);
					return;
				}
				setObservatories((prevData) =>
					prevData.map((observatory) =>
						observatory._id === updatedObservatory._id
							? updatedObservatory
							: observatory,
					),
				);
				if (machine_id)
				{
					toast.success(
						`Successfully connected KStars to ${updatedObservatory.name}`,
					);
				}
				else
				{
					toast.success("Unlinked observatory successfully");
				}
				setIsLinkMenuOpen(false);
			}
			catch (error)
			{
				captureException(error);
				toast.error("Error with updating observatory, please try again");
			}
			finally
			{
				setIsLoading(false);
			}
		},
		[observatory, postObservatoryData, setIsLinkMenuOpen],
	);

	const handleDelete = useCallback(async () =>
	{
		const res = await deleteObservatory(observatory._id);
		if (res) return toast.error(res);
		setObservatories((observatories) =>
			observatories.filter((item) => item._id !== observatory._id),
		);
	}, [setObservatories, deleteObservatory, toast]);

	const handleClick = async () =>
	{
		if (connectedKStarID === observatory.machine_id)
		{
			dispatch(setupActions.setSetupParameterValue("kstarsActiveID", ""));
		}
		else if (isActive)
		{
			dispatch(
				setupActions.setSetupParameterValue(
					"kstarsActiveID",
					observatory.machine_id,
				),
			);
			dispatch(
				wssMessageSocketActions.sendText(
					observatory.machine_id,
					commands.SET_ACTIVE_KSTARS_CONNECTION,
				),
			);
			dispatch(
				wssMediaSocketActions.sendText(
					observatory.machine_id,
					commands.SET_ACTIVE_KSTARS_CONNECTION,
				),
			);
		}
		else if (observatory.machine_id && observatory.machine_id !== "null")
		{
			handleUnlinkClick();
		}
		else setIsLinkMenuOpen(true);
	};

	const handleUnlinkClick = () => updateObservatory(null);

	return (
		<Box
			sx={{
				border: "1px solid black",
				borderRadius: "4px",
				minWidth: "auto",
				padding: ".75rem",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				alignItems: "center",
				gap: "6px",
				position: "relative",
			}}
		>
			{!isViewMode && (
				<IconButton
					sx={{
						position: "absolute",
						right: 0,
						top: 0,
						padding: "0 !important",
					}}
					onClick={() => setIsAlertOpen(true)}
				>
					<DeleteForeverIcon color="error" style={{ fontSize: "1rem" }} />
				</IconButton>
			)}
			<ObservatoryBox
				name={observatory.name}
				photo={observatory.photos[0]}
				connected={activeKStarsIDS?.some(
					(item) => item.machineID === observatory?.machine_id,
				)}
			/>
			{!isViewMode && (
				<Box sx={[styles.center, { gap: ".375rem" }]}>
					<Button
						sx={{
							backgroundColor: isActive ? "success.main" : "error.main",
							color: "common.white",
						}}
						onClick={handleClick}
					>
						{connectedKStarID === observatory.machine_id || isViewMode
							? s.general.disconnect
							: isActive
								? s.general.select
								: observatory.machine_id && observatory.machine_id !== "null"
									? "unlink"
									: "link"}
					</Button>
					{observatory.machine_id && observatory.machine_id !== "null" && (
						<IconButton onClick={handleUnlinkClick} sx={{ padding: 0 }}>
							<LinkOffIcon style={{ color: Palette.red, fontSize: 20 }} />
						</IconButton>
					)}
				</Box>
			)}

			<ObservatoryLinkModal
				close={closeLinkMenu}
				open={isLinkMenuOpen}
				submit={updateObservatory}
				isLoading={isLoading}
			/>

			<AlertDialog
				show={isAlertOpen}
				handleDelete={handleDelete}
				description="Are you sure you want to delete the observatory? All equipment and the equipment profiles will also be deleted"
				close={() => setIsAlertOpen(false)}
				title="Delete observatory"
			/>
		</Box>
	);
};

export default ObservatorySetupBox;
