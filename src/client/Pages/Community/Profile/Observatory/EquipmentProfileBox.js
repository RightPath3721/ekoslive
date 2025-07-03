import React, { useState } from "react";
import axios from "axios";
import ListItem from "@mui/material/ListItem";
import Box from "@mui/material/Box";
import ListItemButton from "@mui/material/ListItemButton";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import { captureException } from "@sentry/browser";
import useActiveUser from "@hooks/useActiveUser";
import { useActiveObservatory } from "./ObservatoryContext";
import Icon from "@components/Icon";

const EquipmentProfileBox = ({
	toggleView,
	profile,
	idx,
	setEquipmentProfiles,
}) =>
{
	const [isEditMode, setIsEditMode] = useState(false);
	const user = useActiveUser();
	const { observatoryId } = useActiveObservatory();
	const [name, setName] = useState(profile.name);

	const editFormSubmit = async (e) =>
	{
		e?.preventDefault?.();

		if (!user) return;

		try
		{
			const { data } = await axios.patch(
				`/api/equipments/equipment-profile/${profile._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				{ observatoryID: observatoryId, data: { name } },
			);
			setEquipmentProfiles((prev) =>
				prev.map((profile) =>
					data._id === profile._id ? { ...profile, name: data.name } : profile,
				),
			);
			setIsEditMode(false);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	return (
		<ListItem>
			{isEditMode ? (
				<Box
					sx={{ width: "60%", marginRight: "auto" }}
					id="edit-equipment-profile"
					component="form"
					onSubmit={editFormSubmit}
				>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						sx={{ color: "white" }}
						autoFocus
					/>
				</Box>
			) : (
				<ListItemButton
					onClick={() => toggleView(profile._id)}
					sx={{ color: "white" }}
				>
					{idx + 1}.&nbsp;{profile.name}
				</ListItemButton>
			)}
			<IconButton
				onClick={isEditMode ? editFormSubmit : () => setIsEditMode(true)}
				sx={[
					{
						backgroundColor: "#FFFCFA1A",
						borderRadius: "4px",
						width: "36px",
						height: "36px",
						minWidth: "auto",
						padding: 0,
					},
				]}
			>
				<Icon
					color="#CECECE"
					name={isEditMode ? "check" : "edit"}
					size="25px"
				/>
			</IconButton>
		</ListItem>
	);
};

export default EquipmentProfileBox;
