import React, {
	cloneElement,
	useState,
	useEffect,
	memo,
	forwardRef,
} from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import Grid from "@mui/material/Grid";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { typeIcons } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import { manufacturerIcon } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import { useTheme } from "@mui/material/styles";
import useActiveUser from "@hooks/useActiveUser";
import { Can } from "@components/providers/AclProvider";
import { Alert, AlertTitle, Box } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ReactDOM from 'react-dom';
import s from "@common/shared/i18n/i18n";

const ListView = forwardRef(
	(
		{ setShowModal, datas, handleClick, type, selectedItems, setSelectedItems },
		ref,
	) =>
	{
		const { palette } = useTheme();
		const user = useActiveUser();

		const halfLength = Math.ceil(datas?.length / 2);
		const firstHalf = datas?.slice(0, halfLength);
		const secondHalf = datas?.slice(halfLength);
		const [equipmentTypeName, setEquipmentTypeName] = useState("");
		const [showAlert, setShowAlert] = useState(false);

		const handleToggle = (value) => () =>
		{
			setSelectedItems((prevSelectedItems) =>
			{
				// Check if the value exists in the current array of selectedItems
				const valueIndex = prevSelectedItems.indexOf(value);

				if (valueIndex === -1)
				{
					// If the value does not exist, add it
					return [...prevSelectedItems, value];
				}
				else
				{
					// If the value exists, remove it
					return prevSelectedItems.filter((item) => item !== value);
				}
			});
		};

		useEffect(() =>
		{
			const savedEquipmentTypeName = localStorage.getItem("equipmentTypeName");
			if (savedEquipmentTypeName)
			{
				setEquipmentTypeName(JSON.parse(savedEquipmentTypeName));
			}
		}, [setEquipmentTypeName]);

		const handleMouseOver = () => {
			if (type !== "model") {
				setShowAlert(true);
			}
		};

		const handleMouseOut = () => {
			setShowAlert(false);
		};

		const AlertPortal = ({ children }) => {
			const portalRoot = document.getElementById('portal-root') || document.body;
			return ReactDOM.createPortal(children, portalRoot);
		};

		return (
			<Grid container spacing={2}>
				<Grid item xs={6}>
					<List>
						{user && (
							<ListItem button 
								onClick={() => setShowModal(true)}
								onMouseEnter={handleMouseOver}
								onMouseLeave={handleMouseOut}
							>
								<Can action="update" subject="ModeratingStatus">
									<Checkbox sx={{ visibility: "hidden", pr: "5px" }} />
								</Can>
								<ListItemAvatar>
									<Avatar
										sx={{
											borderRadius: "8px",
											color: palette.primary.main,
											background: palette.grey[300],
										}}
									>
										<AddIcon />
									</Avatar>
									{showAlert && (
										<AlertPortal>
											<Alert
												severity="info"
												icon={<LightbulbIcon />}
												sx={{
													position: 'fixed',
													top: '200px',
													left: '50%',
													transform: 'translate(-50%, -50%)',
													zIndex: 9999,
													width: '500px',
													boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.2)',
													'& .MuiAlert-message': {
														width: '100%'
													}
												}}
											>
												<AlertTitle sx={{ fontWeight: 'bold', color: palette.primary.main }}>
													{s.general.manufacturer_tip_title}
												</AlertTitle>
													{s.general.manufacturer_tip_section_1}
												<Box sx={{ mt: 1 }}>
													{s.general.manufacturer_tip_section_2}
												</Box>
											</Alert>
										</AlertPortal>
									)}
								</ListItemAvatar>
								<Typography variant="body2" color="primary">
									Add {type === "model" ? "Model" : "Manufacturer"}
								</Typography>
							</ListItem>
						)}
						{firstHalf.map((data, index) => (
							<ListItem button key={index} onClick={() => handleClick(data)}>
								<Can action="update" subject="ModeratingStatus">
									<Checkbox
										sx={{ pr: "5px" }}
										checked={selectedItems.indexOf(data._id) !== -1}
										onClick={(event) =>
										{
											event.stopPropagation();
											handleToggle(data._id)();
										}}
									/>
								</Can>
								<ListItemAvatar>
									<Avatar
										sx={{
											borderRadius: "8px",
											background: palette.grey[300],
											opacity: !data.moderation_report
												? 1
												: data.moderation_report.status !== "APPROVED"
													? 0.5
													: 1,
										}}
										alt={data.label || data.name}
										src={data.logo}
									>
										{type === "model"
											? cloneElement(
													typeIcons[
														equipmentTypeName ? equipmentTypeName : "Mount"
													],
													{
														width: 24,
													},
												)
											: cloneElement(manufacturerIcon, {
													width: 24,
												})}
									</Avatar>
								</ListItemAvatar>
								<ListItemText primary={data.name || data.label} />
							</ListItem>
						))}
					</List>
				</Grid>
				<Grid item xs={6}>
					<List>
						{secondHalf.map((data, index) =>
						{
							const isLastItem = index === secondHalf.length - 1;
							return (
								<ListItem
									button
									key={index}
									onClick={() => handleClick(data)}
									ref={isLastItem ? ref : null}
								>
									<Can action="update" subject="ModeratingStatus">
										<Checkbox
											sx={{ pr: "5px" }}
											checked={selectedItems.indexOf(data._id) !== -1}
											onClick={(event) =>
											{
												event.stopPropagation();
												handleToggle(data._id)();
											}}
										/>
									</Can>
									<ListItemAvatar>
										<Avatar
											sx={{
												borderRadius: "8px",
												background: palette.grey[300],
												opacity: !data.moderation_report
													? 1
													: data.moderation_report.status !== "APPROVED"
														? 0.5
														: 1,
											}}
											alt={data.label || data.name}
											src={data.logo}
										>
											{type === "model"
												? cloneElement(
														typeIcons[
															equipmentTypeName ? equipmentTypeName : "Mount"
														],
														{
															width: 24,
														},
													)
												: cloneElement(manufacturerIcon, {
														width: 24,
													})}
										</Avatar>
									</ListItemAvatar>
									<ListItemText primary={data.name || data.label} />
								</ListItem>
							);
						})}
					</List>
				</Grid>
			</Grid>
		);
	},
);

export default memo(ListView);
