import React, { useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import axios from "axios";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material";
import useActiveUser from "@hooks/useActiveUser";
import { Can } from "@components/providers/AclProvider";
import { Palette } from "@common/shared/common/styles";

const MottoComponent = ({ userProfile, updateMotto }) =>
{
	const { breakpoints } = useTheme();
	const user = useActiveUser();
	const [isEdit, setIsEdit] = useState(false);
	const [value, setValue] = useState("");

	const submit = async (e) =>
	{
		e?.preventDefault();

		if (!user) return;

		try
		{
			await axios.patch(
				`/api/social?username=${encodeURIComponent(user.username)}&token=${user.token}`,
				{ profile_description: value },
			);
			updateMotto(value);
			setIsEdit(false);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		setValue(userProfile?.profile_description ?? "");
	}, [userProfile]);

	return (
		<Box
			id="profile_motto"
			sx={{
				backgroundColor: "#101010",
				borderRadius: "8px",
				boxShadow: "0px 0px 50px 1px #FFFFFF1A",
				maxWidth: "50%",
				width: "auto",
				position: "absolute",
				left: ".75rem",
				[breakpoints.up("sm")]: {
					left: "50%",
					transform: "translateX(-50%)",
				},
			}}
		>
			<Can action="update" subject="Social" object={userProfile} passThrough>
				{(allowed) =>
					allowed ? (
						isEdit ? (
							<Box
								onSubmit={submit}
								sx={{ borderRadius: "16px", backgroundColor: "#1D1D1D" }}
								component="form"
							>
								<TextField
									value={value}
									onChange={(e) =>
										e.target.value.length > 40 ? null : setValue(e.target.value)
									}
									onBlur={submit}
									inputProps={{ style: { color: "white" } }}
								/>
							</Box>
						) : (
							<Chip
								sx={{
									padding: ".25rem",
									height: "auto",
									width: "100%",
									padding: "12px 8px",
									color: Palette.white,
									"& .MuiChip-label": {
										whiteSpace: "normal",
										display: "-webkit-box",
										WebkitLineClamp: 3,
										WebkitBoxOrient: "vertical",
										padding: 0,
									},
								}}
								onClick={() => setIsEdit(true)}
								label={userProfile.profile_description}
							/>
						)
					) : (
						<Chip
							sx={{
								cursor: "default",
								padding: ".25rem",
								height: "auto",
								width: "100%",
								color: Palette.white,
								"& .MuiChip-label": {
									whiteSpace: "normal",
									display: "-webkit-box",
									WebkitLineClamp: 3,
									WebkitBoxOrient: "vertical",
									padding: 0,
								},
							}}
							label={userProfile.profile_description}
						/>
					)
				}
			</Can>
		</Box>
	);
};

export default MottoComponent;
