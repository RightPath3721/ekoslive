import Grid from "@mui/material/Grid";
import React, { Suspense, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectConnected, selectConnectionOnline, selectUser } from "@redux/selectors";
import { ListItems } from "../../helpers/common";
import NestedList from "@components/ListItems";
import TabLoader from "@components/TabLoader";
import { useLocation } from "react-router-dom";
import { wssMessageSocketActions, wssMediaSocketActions, wssWebSocketActions } from "@redux/actions";
import axios from "axios";
import commands from "@commands";

// Styles
const LOCAL_STYLES = {
	root: {
		backgroundColor: "#1d1d1d",
		overflow: "hidden",
		fontFamily: "Roboto",
		display: "flex",
		flexDirection: "row",
		flexWrap: "nowrap",
		height: "fit-content",
		minHeight: "100vh",
		paddingTop: "88px",
	},
};

const Setup = ({renter}) =>
{
	// KStars is running and connected to online server
	const kstarsRunning = useSelector(selectConnected);
	// Ekos profile is running
	const ekosProfileRunnig = useSelector(selectConnectionOnline);
	const dispatch = useDispatch();
	const location = useLocation();
	const user = useSelector(selectUser);

	const [currentList, setCurrentList] = useState("Setup");
	const handleChange = (list) =>
	{
		setCurrentList(list);
	};

	useEffect(() =>
	{
		if (kstarsRunning && ekosProfileRunnig)
		{
			setCurrentList("Ekos");
		}
		else if (kstarsRunning)
		{
			setCurrentList("Setup");
		}
		else
		{
			setCurrentList("View");
		}
	}, [kstarsRunning, ekosProfileRunnig]);

	return (
		<Grid component="main" container style={LOCAL_STYLES.root}>
			<NestedList activeSection={currentList} handleClick={handleChange} renter={renter} />
			<Suspense fallback={<TabLoader />}>
				{ListItems.map((oneItem) =>
				{
					const ActiveTab = oneItem.component;
					return (
						<ActiveTab
							key={oneItem.title}
							active={oneItem.title === currentList}
						/>
					);
				})}
			</Suspense>
		</Grid>
	);
};

export default Setup;
