import React, { useCallback, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Modal, useTheme } from "@mui/material";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PlusIcon from "@client/icons/PlusIcon";
import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import AddObservatoryForm from "@client/views/Setup/EkosInstanceSelector/AddObservatoryForm";
import { selectUser } from "@redux/selectors";
import { useSelector } from "react-redux";
import { planType } from "@indi/enums";
import { Palette } from "@common/shared/common/styles";
import { useNavigate } from "react-router-dom";

const AddObservatoryItem = ({ setObservatories, observatories }) =>
{
	const { palette } = useTheme();
	const navigate = useNavigate();
	const isMediumScreen = useMediaQuery({ query: "(min-width: 480px)" });
	const [isObservatoryFormOpen, setIsObservatoryFormOpen] = useState(false);
	const [openPlanUpdateModal, setOpenPlanUpdateModal] = useState(false);
	const user = useSelector(selectUser);

	const toggleObservatoryForm = useCallback(() =>
	{
		if (
			user &&
			(user.plan_id === planType.DEFAULT ||
				user.plan_id === planType.PRO_PLAN) &&
			observatories &&
			observatories.length > 0
		)
		{
			setOpenPlanUpdateModal(true);
		}
		else
		{
			setIsObservatoryFormOpen((prev) => !prev);
		}
	}, [
		user,
		observatories?.length,
		setOpenPlanUpdateModal,
		setIsObservatoryFormOpen,
	]);

	const navigateToUpdate = () =>
	{
		navigate("/pricing");
		setOpenPlanUpdateModal(false);
	};

	return (
		<>
			<Grid
				item
				sx={{
					width: "100%",
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				<Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
					<Button
						sx={[
							styles.center,
							{
								display: "flex",
								padding: 0,
								width: "100%",
								height: "auto",
							},
						]}
						onClick={toggleObservatoryForm}
						variant="text"
					>
						<Box
							sx={[
								styles.center,
								{
									display: "flex",
									flexDirection: "column",
									borderRadius: "15px",
									backgroundColor: palette.black[600],
									width: "100%",
									height: "100%",
									aspectRatio: "1 / 1",
								},
							]}
							component="span"
							display="inline-block"
						>
							<PlusIcon
								height={isMediumScreen ? 44 : 32}
								width={isMediumScreen ? 44 : 32}
							/>
							{user &&
								(user.plan_id === planType.DEFAULT ||
									user.plan_id === planType.PRO_PLAN) &&
								(observatories?.length > 0) &&
								(
									<>
										<Typography>
											Enjoy unlimited observatories with EkosLive Ultimate.
										</Typography>
										<Typography
											onClick={navigateToUpdate}
											sx={{ color: Palette.orange, cursor: "pointer" }}
										>
											Upgrade Now!
										</Typography>
									</>
								)}
						</Box>
					</Button>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography textAlign="left">
							{s.general.new_observatory}
						</Typography>
					</Box>
				</Box>
			</Grid>

			{!openPlanUpdateModal && (
				<AddObservatoryForm
					close={toggleObservatoryForm}
					open={isObservatoryFormOpen}
					setObservatories={setObservatories}
				/>
			)}
			<Modal
				open={openPlanUpdateModal}
				onClose={() => setOpenPlanUpdateModal(false)}
				sx={{ display: "flex" }}
			>
				<dialog className="relative max-h-[85vh] min-h-[20vh] flex-center items-start flex-col gap-4 p-7 bg-black-primary text-white rounded-lg">
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "6px",
						}}
					>
						<Typography>
							Enjoy unlimited observatories with EkosLive Ultimate.
						</Typography>
						<Typography
							onClick={navigateToUpdate}
							sx={{ color: Palette.orange, cursor: "pointer" }}
						>
							Upgrade Now!
						</Typography>
					</Box>
				</dialog>
			</Modal>
		</>
	);
};

export default AddObservatoryItem;
