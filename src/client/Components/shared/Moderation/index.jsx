import React, { useEffect, useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import ModerationTable from "./ModerationTable";
import AbuseReportTable from "./AbuseReportTable";
import { captureException } from "@sentry/browser";
import { ekosliveServer } from "@client/config";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { useModerationContext } from "@components/providers/ModerationProvider";
import { Badge } from "@mui/material";

const postColumns = [
	{ id: "title", label: s.general.title, minWidth: 100 },
	{ id: "full_name", label: s.general.submitted_by, minWidth: 30 },
	{ id: "createdAt", label: s.general.submitted_date, minWidth: 30 },
	{ id: "action", label: s.general.action, minWidth: 100 },
];

const manufacturerColumns = [
	{ id: "name", label: s.general.title, minWidth: 100 },
	{ id: "full_name", label: s.general.submitted_by, minWidth: 30 },
	{ id: "url", label: "Url", minWidth: 30 },
	{ id: "createdAt", label: s.general.submitted_date, minWidth: 30 },
	{ id: "action", label: s.general.action, minWidth: 100 },
];

const modelColumns = [
	{ id: "label", label: s.general.title, minWidth: 100 },
	{ id: "manufacturerName", label: s.connect.observatory.manufacturer, minWidth: 30},
	{ id: "full_name", label: s.general.submitted_by, minWidth: 30 },
	{ id: "createdAt", label: s.general.submitted_date, minWidth: 30 },
	{ id: "action", label: s.general.action, minWidth: 100 },
];

const observatoryColumns = [
	{ id: "name", label: s.general.title, minWidth: 100 },
	{ id: "full_name", label: s.general.submitted_by, minWidth: 30 },
	{ id: "createdAt", label: s.general.submitted_date, minWidth: 30 },
	{ id: "action", label: s.general.action, minWidth: 100 },
];

function CustomTabPanel(props)
{
	const { children, value, index, ...other } = props;

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

/**
 * Generates accessibility properties for a tab element.
 * @param {number} index - The index of the tab for which to generate the accessibility properties.
 * @returns {object} - An object containing the `id` and `aria-controls` attributes.
 */
function a11yProps(index)
{
	return {
		id: `simple-tab-${index}`,
		"aria-controls": `simple-tabpanel-${index}`,
	};
}

const Moderation = () =>
{
	const user = useSelector(selectUser);
	const { count, setCount } = useModerationContext();

	const [abuseReports, setAbuseReports] = useState([]);
	const [posts, setPosts] = useState([]);
	const [manufacturers, setManufacturers] = useState([]);
	const [models, setModels] = useState([]);
	const [observatories, setObservatories] = useState([]);

	const [value, setValue] = useState(0);

	// Sets value to change tabs
	const handleChange = (event, newValue) =>
	{
		setValue(newValue);
		switch (newValue)
		{
			case 1:
				fetchManufacturers();
				break;
			case 2:
				fetchModels();
				break;
			case 3:
				fetchObservatories();
				break;
			case 4:
				fetchAbuseReports();
				break;
		}
	};

	/**
	 * Total number of pending tasks.
	 * @returns {Promise<void>} - A Promise that resolves when the total number of pending tasks are fetched.
	 * @async
	 */
	const fetchPendingTasks = async () =>
	{
		try
		{
			if (!user) return null;
			const url = `/api/equipments/pending-tasks?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setCount(response.data.count);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	/**
	 * Fetches pending manufacturers from the server.
	 * @returns {Promise<void>} - A Promise that resolves when the manufacturers are fetched and set in the state.
	 * @async
	 */
	const fetchManufacturers = async () =>
	{
		try
		{
			if (!user) return null;
			const url = `/api/equipments/manufacturers/pending?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setManufacturers(response.data.manufacturers);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	/**
	 * Fetches pending models from the server.
	 * @returns {Promise<void>} - A Promise that resolves when the manufacturers are fetched and set in the state.
	 * @async
	 */
	const fetchModels = async () =>
	{
		try
		{
			if (!user) return null;
			const url = `/api/equipments/equipment-models/pending?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setModels(response.data.models);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const fetchObservatories = async () =>
	{
		try
		{
			if (!user) return null;
			const url = `/api/observatories/pending?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setObservatories(response.data.observatories);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	/**
s	 *
	 * @returns {Promise<void>} - A Promise that resolves when the manufacturers are fetched and set in the state.
	 * @async
	 */
	const fetchAbuseReports = async () =>
	{
		try
		{
			if (!user) return null;
			const url = `/api/posts/abuse-report?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setAbuseReports(response.data);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	/**
	 * Fetches pending posts from the server.
	 * @returns {Promise<void>} - A Promise that resolves when the manufacturers are fetched and set in the state.
	 * @async
	 */
	const fetchPosts = async () =>
	{
		try
		{
			if (!user) return null;
			const url = `/api/posts/pending?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setPosts(response.data);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		fetchPosts();
	}, []);

	return (
		<Box
			sx={{
				p: 2,
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
			}}
		>
			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<Tabs
					sx={{
						"& .MuiTabs-indicator": {
							backgroundColor: "#ff6600",
						},
						"& .MuiTab-root": {
							color: "#fff",
						},
						"& .MuiTab-root.Mui-selected": {
							color: "#ff6600",
						},
					}}
					value={value}
					onChange={handleChange}
					aria-label="basic tabs example"
				>
					{["Post", "Manufacturer", "Equipment Model", "Observatory", "Abuse Report"].map(
						(label, index) => (
							<Tab
								key={`tab-${index}`}
								label={
									<Badge
										color="primary"
										badgeContent={count[index]}
										sx={{
											'& .MuiBadge-badge': {
												right: -6,
												top: -4
											}
										}}
									>
										{label}
									</Badge>
								}
								{...a11yProps(index)}
							/>
						),
					)}
				</Tabs>
			</Box>
			<CustomTabPanel value={value} index={0}>
				<ModerationTable
					key="post"
					mode="post"
					columns={postColumns}
					posts={posts}
					setPosts={setPosts}
					fetchPendingTasks={fetchPendingTasks}
				/>
			</CustomTabPanel>
			<CustomTabPanel value={value} index={1}>
				<ModerationTable
					key="manufacturer"
					mode="manufacturer"
					columns={manufacturerColumns}
					posts={manufacturers}
					setPosts={setManufacturers}
					fetchPendingTasks={fetchPendingTasks}
				/>
			</CustomTabPanel>
			<CustomTabPanel value={value} index={2}>
				<ModerationTable
					key="model"
					mode="model"
					columns={modelColumns}
					posts={models}
					setPosts={setModels}
					fetchPendingTasks={fetchPendingTasks}
				/>
			</CustomTabPanel>
			<CustomTabPanel value={value} index={3}>
				<ModerationTable
					key="observatory"
					mode="observatory"
					columns={observatoryColumns}
					posts={observatories}
					setPosts={setObservatories}
					fetchPendingTasks={fetchPendingTasks}
				/>
			</CustomTabPanel>
			<CustomTabPanel value={value} index={4}>
				<AbuseReportTable
					key="abuseReport"
					posts={abuseReports}
					setPosts={setAbuseReports}
					fetchPendingTasks={fetchPendingTasks}
				/>
			</CustomTabPanel>
		</Box>
	);
};

export default Moderation;
