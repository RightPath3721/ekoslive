import React, { memo } from "react";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Button from "@mui/material/Button";
import s from "@common/shared/i18n/i18n";
import Icon from "./Icon";
import { Palette } from "@common/shared/common/styles";
import { notificationConstants } from "@redux/constants";
import { selectSavedNotifications } from "@redux/selectors";
import { Severity } from "@indi/enums";
import CloseButton from "./CloseButton";
import { styles } from "../shared/styles";

const IconType = ({ type }) =>
{
	switch (type)
	{
		case Severity.CRITICAL:
			return <Icon name="dangerous" color="red" />;
		case Severity.INFO:
			return <Icon name="info" color="white" />;
		case Severity.WARNING:
			return <Icon name="warning" color="yellow" />;
	}
};

const NotificationHistory = ({ onClose }) =>
{
	const dispatch = useDispatch();
	const savedNotifications = useSelector(selectSavedNotifications);

	return (
		<Modal open>
			<Box sx={[styles.centerAbsolute, LOCAL_STYLES.modal]}>
				<CloseButton onChange={onClose} top="0px" right="0px" />
				<Typography
					style={{
						textAlign: "center",
						color: "white",
						fontSize: "20px",
					}}
				>
					{s.settings.notifications}
				</Typography>

				<List
					sx={[
						styles.verticalScrollBar,
						{
							display: "grid",
							gridTemplateColumns: "500px",
							alignItems: "center",
							justifyItems: "center",
							gap: "15px",
							maxHeight: "200px",
							overflowY: "scroll",
						},
					]}
				>
					{savedNotifications.map((notification) =>
					{
						return (
							<ListItem sx={LOCAL_STYLES.container} key={notification.ts}>
								<Typography
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: "6px",
										color: "white",
									}}
								>
									<IconType type={get(notification, "severity", 0)} />
									{get(notification, "message", "")}
								</Typography>
								<Typography sx={LOCAL_STYLES.text}>
									{new Date(get(notification, "ts", 0)).toLocaleTimeString()}
								</Typography>
							</ListItem>
						);
					})}
				</List>

				<Button
					onClick={() =>
					{
						dispatch({ type: notificationConstants.REMOVE_SAVED_NOTIFICATION });
						onClose();
					}}
					sx={{ alignSelf: "flex-start", backgroundColor: "", color: "white" }}
				>
					{s.general.clear_all}
				</Button>
			</Box>
		</Modal>
	);
};

export default memo(NotificationHistory);

const LOCAL_STYLES = {
	modal: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		outline: "none",
		gap: "15px",
	},
	container: {
		display: "flex",
		flexDirection: "row",
		backgroundColor: Palette.grey44,
		padding: "10px",
		borderBottom: `1px solid ${Palette.grey22}`,
		justifyContent: "space-between",
		borderRadius: "10px",
		gap: "10px",
	},
	text: { color: Palette.grey99, fontSize: "16px" },
};
