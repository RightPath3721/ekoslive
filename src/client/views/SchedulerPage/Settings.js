import React, { memo } from "react";
import GeneralSettings from "./GeneralSettings";
import JobStartup from "./JobStartup";
import JobContraints from "./JobConstrainsts";
import JobCompletion from "./JobCompletion";
import ObservatoryStartup from "./ObservatoryStartup";
import AbortedJob from "./AbortedJob";
import ObservatoryShutdown from "./ObservatoryShutdown";
import TabView from "../../Components/TabView";
import { Box } from "@mui/material";
import CloseButton from "@components/CloseButton";
import AdvancedSettings from "./AdvancedSettings";

const containerStyle = {
	width: "600px",
	display: "grid",
	placeItems: "center",
	paddingBlock: "6px",
	gap: "12px",
};

const Settings = ({ setState, jobIndex }) =>
{
	const headers = [
		{
			title: "General Settings",
			component: <GeneralSettings jobIndex={jobIndex} />,
			containerStyle,
		},
		{
			title: "Job Startup",
			component: <JobStartup />,
			containerStyle,
		},
		{
			title: "Job Contraints",
			component: <JobContraints />,
			containerStyle: {
				...containerStyle,
				justifyItems: "start",
			},
		},
		{
			title: "Job Completion",
			component: <JobCompletion />,
			containerStyle,
		},
		{
			title: "Aborted Job",
			component: <AbortedJob />,
			containerStyle,
		},
		{
			title: "Observatory Startup",
			component: <ObservatoryStartup />,
			containerStyle,
		},
		{
			title: "Observatory Shutdown",
			component: <ObservatoryShutdown />,
			containerStyle,
		},
		{
			title: "Advanced",
			component: <AdvancedSettings />,
			containerStyle,
		},
	];

	return (
		<Box>
			{jobIndex !== -1 && (
				<CloseButton top="20px" onChange={() => setState()} icon="save" />
			)}
			<TabView onClose={setState} tabs={headers} />
		</Box>
	);
};

export default memo(Settings);
