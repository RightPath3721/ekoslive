import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { Link } from "react-router-dom";
import { useTheme } from "@mui/material";
import { useActivate } from "react-activation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import EquipmentListItem from "./EquipmentListItem";
import { styles } from "@client/shared/styles";
import PlusIcon from "@client/icons/PlusIcon";
import useActiveUser from "@hooks/useActiveUser";

const EmptyEquipmentMessage = () => (
	<Typography variant="body2">
		The selected equipment profile has no equipment yet
	</Typography>
);

const AddEquipmentItem = ({ profileId, observatoryId, observatoryName }) =>
{
	const { palette } = useTheme();

	return (
		<Link
			to="/community/equipment"
			state={{ selecting: true, profileId, observatoryId, observatoryName }}
			style={{ ...styles.center, gap: ".75rem", justifyContent: "flex-start" }}
		>
			<Typography
				sx={{
					width: 24,
					height: 24,
					borderRadius: "4px",
					display: "grid",
					placeItems: "center",
					backgroundColor: palette.black[600],
				}}
				display="inline-block"
				component="span"
			>
				<PlusIcon width={16} height={16} color={palette.primary.main} />
			</Typography>
			<Typography
				sx={{ color: palette.primary.main }}
				variant="h3"
				fontWeight={500}
				lineHeight={1.1}
				component="span"
			>
				Add Device
			</Typography>
		</Link>
	);
};

const EquipmentList = ({ profileId, isOwner }) =>
{
	const { observatory } = useObservatoryPageContext();
	const [equipmentList, setEquipmentList] = useState([]);
	const user = useActiveUser();

	useActivate(() =>
	{
		fetchEquipment();
	});

	useEffect(() =>
	{
		fetchEquipment();
	}, [profileId]);

	const fetchEquipment = useCallback(async () =>
	{
		if (!observatory || !profileId)
		{
			setEquipmentList([]);
			return;
		}

		try
		{
			const { data } = await axios.get("/api/equipments", {
				params: {
					profileId: profileId,
				},
			});

			setEquipmentList(data.equipmentList);
		}
		catch (error)
		{
			captureException(error);
			setEquipmentList([]);
		}
	}, [observatory, profileId]);

	const handleDeleteObservatoryProfileEquipment = useCallback(
		async (equipmentId) =>
		{
			if (!user) return;
			try
			{
				await axios.delete(
					`/api/equipments/delete-equipment-from-profile/${equipmentId}`,
					{
						params: {
							equipmentProfileId: profileId,
							username: user.username,
							token: user.token,
						},
					},
				);
				setEquipmentList((prevList) =>
					prevList.filter((equipment) => equipment._id !== equipmentId),
				);
			}
			catch (error)
			{
				captureException(error);
			}
		},
		[profileId, user, setEquipmentList],
	);

	return (
		<Box
			sx={{ marginTop: { xxs: ".75rem", md: "1.75rem" } }}
			display="grid"
			gridTemplateColumns="repeat(2, 1fr)"
			justifyContent="flex-start"
			gap="1.5rem"
			alignItems="flex-start"
		>
			{isOwner && (
				<AddEquipmentItem
					observatoryName={observatory?.name}
					observatoryId={observatory?._id}
					profileId={profileId}
				/>
			)}
			{equipmentList.length > 0 ? (
				equipmentList.map((equipment) => (
					<EquipmentListItem
						key={equipment._id}
						equipment={equipment}
						handleDeleteObservatoryProfileEquipment={
							handleDeleteObservatoryProfileEquipment
						}
						isOwner={isOwner}
					/>
				))
			) : (
				<EmptyEquipmentMessage />
			)}
		</Box>
	);
};

export default EquipmentList;
