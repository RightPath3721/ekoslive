import React from "react";
import Box from "@mui/material/Box";
import { Palette } from "@common/shared/common/styles";
import {
	VerticalTimeline,
	VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import { FaRegStar, FaRegCalendarAlt } from "react-icons/fa";
import { Typography } from "@mui/material";

const events = [
	{
		title: "Version 1.6 Released",
		date: "April 07, 2025",
		changes: [
			"Observatory Settings: Enhanced configuration options for observatory management.",
			"Observatory Rental(Beta): Implemented a comprehensive system for renting and sharing observatories.",
			"User Accounts: Added robust user account management with profile customization.",
			"Notifications: Integrated email notifications for important events.",
		],
		icon: <FaRegStar />,
	},
	{
		title: "Version 1.5 Released",
		date: "January 09, 2025",
		changes: [
			"View: Added a new gallery grid/list view.",
			"Stella AI: Added a waveform animation while Stella AI is speaking, so you can click it to stop the speech.",
			"Equipment: Added new manufacturers and equipment models.",
		],
		icon: <FaRegStar />,
	},
	{
		title: "Version 1.4 Released",
		date: "December 05, 2024",
		changes: [
			"Stella AI: You can ask Stella AI about real-time status of the running operation (e.g. How many seconds until the job is complete?)",
			"Weather: Added weather bar and 3-hour cloud layer map",
			"Equipment: Added numerous manufactures and models",
		],
		icon: <FaRegStar />,
	},
	{
		date: "September 04, 2024",
		title: "Version 1.3 Released",
		changes: [
			"Community: Discover and engage with the community.",
			"Observatories: Explore observatories created by others and build your own.",
			"Equipment: Specific equipment, use advanced filters, and add items to your observatory.",
			"Observatories Map: Locate nearby observatories and filter them by distance",
			"UI improvements: Significant updates for enhanced user experience.",
		],
		icon: <FaRegStar />,
	},
	{
		date: "July 01, 2024",
		title: "Version 1.2 Released",
		changes: [
			"Multiple connections: Easily switch between your observatories.",
			"Observatory: Link your observatory to KStars.",
			"Achievements: Follow your progress with achievements system.",
			"Ekos: Major UI fixes, stability improvements.",
			"Stella: Stella has a narration response function, allowing it to interact with users like a human.",
		],
		icon: <FaRegCalendarAlt />,
	},
	{
		date: "May 05, 2024",
		title: "Version 1.1 Released",
		changes: [
			"Stella AI: Stella is a revolutionary new way to interact with StellarMate",
			"Analysis images: Stella can analyze uploaded images with astrometry.net to locate targets",
			"XML Files: Generating XML for sequence and scheduler",
			"Targets: Stella can find target objects with some parameters, such as minimum altitude, maximum magnitude, type of object, direction, minimum duration,  minimum FOV and maximum FOV, Julian Date, and observable with user camera(reasonable FOV range)",
			"View: Stella can filter images with some parameters, such as filter, frame, minimum and maximum airmass, binning, date, minimum and maximum exposure, object name",
			"Profile: New tab for your own profile with observatories and equipment",
		],
		icon: <FaRegStar />,
	},
	{
		date: "March 01, 2024",
		title: "Version 1.0 Released",
		changes: [
			"Setup: Smoother UX",
			"Ekos: Better UI for modules & settings",
			"Targets: UI Revamps",
			"View: Clearer UI",
			"Ekos Modules: Enhanced settings",
			"Focus/Align/Guide: Upgraded previews & graphs",
			"Quick Controls: Better UI, more options",
			"Cloud Storage: Save/load for sequences & schedules files",
		],
		icon: <FaRegStar />,
	},
];

const VersionPopover = () =>
{
	return (
		<Box
			sx={{
				backgroundColor: Palette.grey22,
				display: "flex",
				paddingTop: "100px",
			}}
		>
			<style>
				{`
          .container {
            background-color: ${Palette.grey22};
            padding: 20px;
          }
        `}
			</style>
			<VerticalTimeline
				className="container"
				style={{ backgroundColor: "#f4f4f4" }}
			>
				{events.map((event, index) =>
				{
					return (
						<VerticalTimelineElement
							key={index}
							className="vertical-timeline-element--work"
							contentStyle={{
								background: Palette.orange,
								color: Palette.white,
							}}
							contentArrowStyle={{ borderRight: "7px solid #f0f0f0" }}
							date={event.date}
							iconStyle={{ background: "#2196F3", color: "#fff" }}
							icon={event.icon}
						>
							<Typography sx={{ color: Palette.grey22, fontWeight: "bold" }}>
								{event.title}
							</Typography>
							{event.changes.map((change, idx) =>
							{
								const [title, description] = change.split(":");
								return (
									<li key={idx}>
										<strong>{title?.trim()}:</strong> {description?.trim()}
									</li>
								);
							})}
						</VerticalTimelineElement>
					);
				})}
			</VerticalTimeline>
		</Box>
	);
};

export default VersionPopover;
