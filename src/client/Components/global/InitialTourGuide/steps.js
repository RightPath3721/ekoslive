import React from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useDispatch } from "react-redux";
import { achievementsConstants, ekosConstants } from "@redux/constants";
import s from "@common/shared/i18n/i18n";

const steps = {
	profile: [
		{
			content: s.tourGuide.initial_tour_guide.profile_general,
		},
		{
			selector: "#side-panel",
			content: s.tourGuide.initial_tour_guide.side_panel,
		},
		{
			selector: "#profile-page",
			content: s.tourGuide.initial_tour_guide.profile_page,
		},
		{
			content: ({ goTo }) =>
			{
				return (
					<Box
						display="flex"
						flexDirection="column"
						gap=".5rem"
						padding=".75rem"
						justifyContent="center"
						alignItems="center"
					>
						<Typography sx={{ color: "#272727" }}>
							{s.tourGuide.initial_tour_guide.profile_next}
						</Typography>
						<GuideLink
							goto={goTo}
							label={s.general.go_to_feed}
							link="/community/"
						/>
					</Box>
				);
			},
		},
	],
	feed: [
		{
			content: s.tourGuide.initial_tour_guide.feed_general,
			stepInteraction: true,
		},
		{
			selector: "#feed-page",
			content: s.tourGuide.initial_tour_guide.feed_page,
			stepInteraction: true,
		},
		{
			content: ({ goTo }) =>
			{
				return (
					<Box
						display="flex"
						flexDirection="column"
						gap=".5rem"
						padding=".75rem"
						justifyContent="center"
						alignItems="center"
					>
						<Typography sx={{ color: "#272727" }}>
							{s.tourGuide.initial_tour_guide.feed_next}
						</Typography>
						<GuideLink
							goto={goTo}
							label={s.general.go_to_users}
							link="/community/users/"
						/>
					</Box>
				);
			},
			stepInteraction: true,
		},
	],
	users: [
		{
			content: s.tourGuide.initial_tour_guide.users_general,
			stepInteraction: true,
		},
		{
			selector: "#users-page",
			content: s.tourGuide.initial_tour_guide.users_page,
			stepInteraction: true,
		},
		{
			content: ({ goTo }) =>
			{
				return (
					<Box
						display="flex"
						flexDirection="column"
						gap=".5rem"
						padding=".75rem"
						justifyContent="center"
						alignItems="center"
					>
						<Typography sx={{ color: "#272727" }}>
							{s.tourGuide.initial_tour_guide.users_next}
						</Typography>
						<GuideLink
							goto={goTo}
							label={s.general.go_to_equipment}
							link="/community/equipment/"
						/>
					</Box>
				);
			},
			stepInteraction: true,
		},
	],
	equipment: [
		{
			content: s.tourGuide.initial_tour_guide.equipment_general,
			stepInteraction: true,
		},
		{
			selector: "#equipment-page",
			content: s.tourGuide.initial_tour_guide.equipment_page,
			stepInteraction: true,
		},
		{
			content: ({ goTo }) =>
			{
				return (
					<Box
						display="flex"
						flexDirection="column"
						gap=".5rem"
						padding=".75rem"
						justifyContent="center"
						alignItems="center"
					>
						<Typography sx={{ color: "#272727" }}>
							{s.tourGuide.initial_tour_guide.equipment_next}
						</Typography>
						<GuideLink
							goto={goTo}
							label={s.general.go_to_observatories}
							link="/community/profile/observatories"
						/>
					</Box>
				);
			},
			stepInteraction: true,
		},
	],
	observatories: [
		{
			content: s.tourGuide.initial_tour_guide.observatories_general,
		},
		{
			selector: "#observatory-page",
			content: s.tourGuide.initial_tour_guide.observatories_page,
		},
		{
			content: ({ close }) =>
			{
				return (
					<Box
						display="flex"
						flexDirection="column"
						gap=".5rem"
						padding=".75rem"
						justifyContent="center"
						alignItems="center"
					>
						<Typography sx={{ color: "#272727" }}>
							{s.tourGuide.initial_tour_guide.final_step}
						</Typography>
						<GuideLink label={s.general.engage} isLast close={close} />
					</Box>
				);
			},
			stepInteraction: true,
		},
	],
};

const GuideLink = ({ label, goto, link, isLast, close }) =>
{
	const navigate = useNavigate();
	const dispatch = useDispatch();

	return (
		<Button
			variant="contained"
			sx={{ width: "max-content" }}
			onClick={() =>
			{
				if (isLast)
				{
					dispatch({
						type: ekosConstants.GET_ECHO_DATA,
						data: { type: achievementsConstants.EXPLORER, payload: {} },
					});
					close();
				}
				else
				{
					navigate(link);
					goto(0);
				}
			}}
		>
			{label}
		</Button>
	);
};

export default steps;
