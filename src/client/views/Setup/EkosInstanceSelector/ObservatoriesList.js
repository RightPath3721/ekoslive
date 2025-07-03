import React, { useCallback, useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useObservatories from "@hooks/useObservatories";
import { styles } from "@client/shared/styles";
import { wssMessageSocketActions, setupActions } from "@redux/actions";
import {
	selectConnectedKStarInstances,
	selectSocketsConnected,
} from "@redux/selectors";
import commands from "@commands";
import ObservatorySetupBox from "./ObservatorySetupBox";
import CloseButton from "@components/CloseButton";
import Icon from "@components/Icon";
import AddObservatoryForm from "./AddObservatoryForm";

const ObservatoriesList = ({ close }) =>
{
	const dispatch = useDispatch();
	const socketsConnected = useSelector(selectSocketsConnected);
	const { observatories, setObservatories } = useObservatories();
	const connectedKstars = useSelector(selectConnectedKStarInstances);
	const [isAddFormOpen, setIsAddFormOpen] = useState(false);

	useEffect(() =>
	{
		if (!socketsConnected) return;
		dispatch(
			wssMessageSocketActions.sendText({}, commands.GET_CONNECTED_KSTARS),
		);
	}, [socketsConnected]);

	const closeAddForm = useCallback(
		() => setIsAddFormOpen(false),
		[setIsAddFormOpen],
	);

	useEffect(() =>
	{
		if (connectedKstars?.length === 1 && connectedKstars[0].machineID)
		{
			dispatch(
				setupActions.setSetupParameterValue(
					"kstarsActiveID",
					connectedKstars[0].machineID,
				),
			);
			dispatch(
				wssMessageSocketActions.sendText(
					connectedKstars[0].machineID,
					commands.SET_ACTIVE_KSTARS_CONNECTION,
				),
			);
		}
	}, [connectedKstars]);

	return (
		<>
			{isEmpty(observatories) ? (
				<Box sx={[styles.center, { width: "100%", gap: "2rem" }]}>
					<Typography>You don't have any observatories yet</Typography>
					<IconButton
						sx={{ color: "common.white" }}
						onClick={() => setIsAddFormOpen(true)}
					>
						<Icon name="add" size="48px" />
					</IconButton>
				</Box>
			) : (
				<Box
					sx={[
						styles.verticalScrollBar,
						{
							display: "grid",
							gridTemplateColumns: `repeat(${observatories.length < 4 ? observatories.length : 4}, 1fr)`,
							gap: "1.5rem",
							overflowY: "scroll",
							width: "100%",
							height: "fit-content",
							justifyItems: "center",
							alignItems: "start",
							padding: ".75rem",
							position: "relative",
						},
					]}
				>
					{observatories.map((observatory) => (
						<ObservatorySetupBox
							observatory={observatory}
							key={observatory._id}
							setObservatories={setObservatories}
						/>
					))}
					<IconButton
						sx={{ color: "common.white", alignSelf: "center" }}
						onClick={() => setIsAddFormOpen(true)}
					>
						<Icon name="add" size="48px" />
					</IconButton>

					{close && (
						<CloseButton
							onChange={close}
							right="16px"
							top="0px"
							iconSize={20}
						/>
					)}
				</Box>
			)}

			<AddObservatoryForm
				setObservatories={setObservatories}
				close={closeAddForm}
				open={isAddFormOpen}
			/>
		</>
	);
};

export default ObservatoriesList;
