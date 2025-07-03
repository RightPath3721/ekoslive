import React, { cloneElement, useState, useEffect, memo } from "react";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "react-responsive";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import { typeIcons } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import { manufacturerIcon } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import useActiveUser from "@hooks/useActiveUser";
import { forwardRef } from "react";
import { Alert, AlertTitle } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ReactDOM from 'react-dom';
import s from "@common/shared/i18n/i18n";

const getIconSize = (mediumScreen, largeScreen, side) =>
{
	if (side === "height")
	{
		return largeScreen ? 140 : mediumScreen ? 124 : 80;
	}
	else
	{
		return largeScreen ? 80 : mediumScreen ? 70 : 46;
	}
};

const GridView = forwardRef(
	({ setShowModal, datas, handleClick, type, spacing = 2 }, ref) =>
	{
		const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });
		const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });
		const { palette } = useTheme();
		const user = useActiveUser();
		const [showAlert, setShowAlert] = useState(false);

		const [equipmentTypeName, setEquipmentTypeName] = useState("");

		useEffect(() =>
		{
			const savedEquipmentTypeName = localStorage.getItem("equipmentTypeName");
			if (savedEquipmentTypeName)
			{
				setEquipmentTypeName(JSON.parse(savedEquipmentTypeName));
			}
		}, [setEquipmentTypeName]);

		const handleAddNew = () => {
			setShowModal(true);
		};

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
			<Grid
				container
				sx={{
					padding: { xxs: ".75rem", md: "1rem", lg: "1.5rem" }
				}}
				columns={12}
				spacing={spacing}
			>
				{user && (
					<Grid item xxs={12} xs={6} md={3} lg={2}>
						<Card
							sx={{
								aspectRatio: type === "model" ? 1.6 : 1,
								flex: "1",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								borderRadius: "10px",
								background: palette.grey[300],
								position: "relative",
							}}
							onClick={handleAddNew}
							onMouseEnter={handleMouseOver}
							onMouseLeave={handleMouseOut}
							role="button"
						>
							<IconButton sx={{ color: palette.primary.main }}>
								<AddIcon
									sx={{
										fontSize: {
											xxs: "1.25rem",
											xs: "1.5rem",
											sm: "2rem",
											ls: "2.5rem",
										},
									}}
								/>
							</IconButton>
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
						</Card>
						<Typography variant="body2" color={palette.primary.main}>
							Add {type === "model" ? "Model" : "Manufacturer"}
						</Typography>
					</Grid>
				)}
				{datas?.map((data, index) =>
				{
					if (!data) return null;
					const isLastItem = index === datas.length - 1;
					return (
						<Grid
							item
							xxs={12}
							xs={6}
							md={3}
							lg={2}
							key={index}
							ref={isLastItem ? ref : null}
						>
							<Card
								sx={{
									aspectRatio: type === "model" ? 1.6 : 1,
									flex: "1",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center",
									borderRadius: "10px",
									background: palette.grey[300],
									cursor: "pointer",
									position: "relative",
								}}
								onClick={() => handleClick(data)}
								role="link"
							>
								{data.logo ? (
									<CardMedia
										component="img"
										height="100%"
										image={data.logo}
										alt={data?.name || data?.label}
										style={{
											opacity: !data.moderation_report
												? 1
												: data.moderation_report.status !== "APPROVED"
													? 0.2
													: 1,
										}}
									/>
								) : type === "model" ? (
									cloneElement(
										typeIcons[equipmentTypeName ? equipmentTypeName : "Mount"],
										{
											height: getIconSize(
												isMediumScreen,
												isLargeScreen,
												"height",
											),
											width: getIconSize(
												isMediumScreen, 
												isLargeScreen,
												"width",
											),
										},
									)
								) : (
									cloneElement(manufacturerIcon, {
										height: getIconSize(
											isMediumScreen,
											isLargeScreen,
											"height",
										),
										width: getIconSize(isMediumScreen, isLargeScreen, "width"),
									})
								)}
								{(data.moderation_report && !["APPROVED", "PENDING"].includes(
									data.moderation_report?.status 
								)) && (
									<Box
										sx={{
											position: "absolute",
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "center",
											rotate: "-30deg",
											padding: "5px",
											border: `1px solid ${palette.grey.main}`,
											boxShadow: `4px 4px ${palette.grey.main}`,
										}}
									>
										<Typography
											variant="h2"
											sx={{ color: palette.error.main, fontWeight: "bold" }}
										>
											{data.moderation_report?.status}
										</Typography>
									</Box>
								)}
								{data.moderation_report?.status === "PENDING" && (
									<Box
										sx={{
											position: "absolute",
											display: "flex",
											flexDirection: "column",
											justifyContent: "center",
											alignItems: "center",
											padding: "5px",
											border: `1px solid ${palette.grey.main}`,
											boxShadow: `4px 4px ${palette.grey.main}`,
										}}
									>
										<Typography
											variant="h2"
											sx={{
												color: palette.primary.main,
												fontWeight: "bold",
											}}
										>
											{data.moderation_report.status}
										</Typography>
									</Box>
								)}
							</Card>
							<Typography variant="body2">{data.name || data.label}</Typography>
						</Grid>
					);
				})}
			</Grid>
		);
	},
);

export default memo(GridView);
