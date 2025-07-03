import React from "react";
import { isEmpty, isEqual } from "lodash";
import { useSelector } from "react-redux";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import TargetRow from "./TargetRow";
import {
	selectAlmanac,
	selectTargetsObjects,
	selectObservability,
	selectRisetime,
} from "@redux/selectors";
import CircularProgress from "@mui/material/CircularProgress";

const LoadingIndicator = () => (
	<Box sx={{
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		height: "80vh",
		gap: "20px"
	}}>
		<CircularProgress />
		<Typography sx={{ color: Palette.white70 }}>
			Loading targets...
		</Typography>
	</Box>
);

const TargetsList = ({
	displayList,
	dateTime,
	activeList,
	setListsPopup,
	addToList,
}) =>
{
	const targetsObjects = useSelector(selectTargetsObjects);
	const observability = useSelector(selectObservability);
	const risetime = useSelector(selectRisetime);
	const almanac = useSelector(selectAlmanac, isEqual);

	// Initial loading check
	const isLoading = !targetsObjects || !almanac;

	if (isLoading)
	{
		return <LoadingIndicator />;
	}

	let targetRows = [];
	if (isEmpty(displayList))
	{
		return (
			<Typography
				sx={[
					styles.h1,
					{
						textAlign: "center",
						marginTop: "100px",
						color: Palette.white70,
					},
				]}
			>
				{s.targets.no_objects_in_list}
			</Typography>
		);
	}
	else
	{
		for (const oneName of displayList)
		{
			// first check the object's info have been retrieved
			let oneTarget, oneRiseTime, oneObservability;
			if (!isEmpty(targetsObjects))
				oneTarget = targetsObjects.find((object) =>
					object.info ? object.info.name === oneName : undefined,
				);
			if (!isEmpty(risetime))
				oneRiseTime = risetime.find((object) => object.name === oneName);
			if (!isEmpty(observability))
				oneObservability = observability.find(
					(object) => object.name === oneName,
				);

			if (oneTarget && oneTarget.info && almanac)
				targetRows.push(
					<TargetRow
						target={oneTarget}
						almanac={almanac}
						rise={oneRiseTime}
						observability={oneObservability}
						datetime={dateTime}
						activeList={activeList}
						setListsPopup={setListsPopup}
						key={oneTarget.info.name}
						addToList={addToList}
					/>,
				);
		}
	}

	// Show loading while targetRows are being created
	if (!isEmpty(displayList) && isEmpty(targetRows))
	{
		return <LoadingIndicator />;
	}

	// Return empty box only if displayList is empty
	if (isEmpty(displayList) && isEmpty(targetRows))
	{
		return (
			<Box
				sx={{
					alignContent: "center",
					alignItems: "center",
					justifyContent: "center",
					flex: 1,
					flexGrow: 1,
				}}
			></Box>
		);
	}
	else
	{
		return (
			<Box
				id="targetInfo"
				sx={[
					styles.verticalScrollBar,
					{
						display: "flex",
						flexDirection: "column",
						gap: "10px",
						alignItems: "center",
						justifyContent: "flex-start",
						overflowY: "scroll",
						maxHeight: "80vh",
					},
				]}
			>
				{targetRows}
			</Box>
		);
	}
};

export default TargetsList;
