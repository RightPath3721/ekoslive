import LogView from "@components/LogsView";
import TabView from "@components/TabView";
import { ModuleNames } from "@indi/enums";
import { Box } from "@mui/material";
import { getLogs } from "@redux/selectors";
import { isEqual } from "lodash";
import React from "react";
import { useSelector } from "react-redux";

const Logs = () =>
{
	const focusLogs = useSelector(
		(state) => getLogs(state, { module: ModuleNames.focus }),
		isEqual,
	);
	const alignLogs = useSelector(
		(state) => getLogs(state, { module: ModuleNames.align }),
		isEqual,
	);
	const guideLogs = useSelector(
		(state) => getLogs(state, { module: ModuleNames.guide }),
		isEqual,
	);
	const captureLogs = useSelector(
		(state) => getLogs(state, { module: ModuleNames.capture }),
		isEqual,
	);
	const schedulerLogs = useSelector(
		(state) => getLogs(state, { module: ModuleNames.scheduler }),
		isEqual,
	);
	const headers = [
		{
			title: "Focus",
			component: <LogView log={focusLogs} module="Focus" />,
			containerStyle: {
				padding: "10px",
			},
		},
		{
			title: "Guide",
			component: <LogView log={guideLogs} module="Guide" />,
			containerStyle: {
				padding: "10px",
			},
		},
		{
			title: "Align",
			component: <LogView log={alignLogs} module="Align" />,
			containerStyle: {
				padding: "10px",
			},
		},
		{
			title: "Capture",
			component: <LogView log={captureLogs} module="Capture" />,
			containerStyle: {
				padding: "10px",
			},
		},
		{
			title: "Scheduler",
			component: <LogView log={schedulerLogs} module="Scheduler" />,
			containerStyle: {
				padding: "10px",
			},
		},
	];

	return (
		<Box>
			<TabView showXButton={false} tabs={headers} />
		</Box>
	);
};

export default Logs;
