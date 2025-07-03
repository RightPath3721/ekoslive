import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import {
	selectConnectedKStarInstances
} from "@redux/selectors";
import Dropdown from "../../../Components/Dropdown";
import { styles } from "../../../shared/styles";
import s from "@common/shared/i18n/i18n";
import useObservatories from "../../../hooks/useObservatories";
import { Palette } from "@common/shared/common/styles";

const ObservatoryLinkModal = ({
	submit,
	close,
	open,
	initialValue,
	isLoading,
}) =>
{
	const { getObservatories } = useObservatories();
	const [observatoryOptions, setObservatoryOptions] = useState([]);
	const connectedKStarsInstances = useSelector(selectConnectedKStarInstances);
	const [linkedInstance, setLinkedInstance] = useState(
		connectedKStarsInstances.find(
			(KStars) => KStars.machineID === initialValue,
		),
	);
	const [selectedInstance, setSelectedInstance] = useState(null);
	const [options, setOptions] = useState([]);

	const handleChange = useCallback(
		(value) => setSelectedInstance(value),
		[setSelectedInstance],
	);

	const handleUnlink = useCallback(() => {
		submit?.("");
	}, [submit]);

	useEffect(() =>
	{
		// Update linked instance when initialValue changes
		setLinkedInstance(
			connectedKStarsInstances.find(
				(KStars) => KStars.machineID === initialValue,
			)
		);
		
		// Filter out the already linked instance
		const filteredInstances = connectedKStarsInstances.filter(
			(kStars) => 
				// Don't include the currently linked instance
				kStars.machineID !== initialValue &&
				// Don't include instances linked to other observatories
				!observatoryOptions.some(
					(observatory) => observatory.machine_id === kStars.machineID
				)
		);
		

		const mappedOptions = filteredInstances.map((kStars) => ({
			label: kStars.observatoryName || kStars.machineID,
			value: kStars.machineID
		}));

		setOptions(mappedOptions);
	}, [observatoryOptions, connectedKStarsInstances, initialValue]);

	useEffect(() =>
	{
		(async () =>
		{
			const updatedObservatories = await getObservatories();
			setObservatoryOptions(updatedObservatories);
		})();
	}, [selectedInstance]);

	return (
		<Modal open={open} onClose={close}>
			<Paper
				sx={[
					styles.centerAbsolute,
					{
						display: "flex",
						flexDirection: "column",
						gap: "12px",
						padding: "16px",
						zIndex: 1000,
						width: "400px",
					},
				]}
			>
				{linkedInstance ? (
					<>
						<Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
							Currently Linked Observatory
						</Typography>
						<Box 
							sx={{ 
								display: 'flex', 
								alignItems: 'center', 
								justifyContent: 'space-between',
								backgroundColor: Palette.grey33,
								padding: '8px 12px',
								borderRadius: '4px',
								border: `1px solid ${Palette.darkGreen}`
							}}
						>
							<Typography>
								{linkedInstance.observatoryName || linkedInstance.machineID}
							</Typography>
							<IconButton 
								onClick={handleUnlink} 
								disabled={isLoading}
								size="small"
							>
								<LinkOffIcon style={{ color: Palette.red, fontSize: 20 }} />
							</IconButton>
						</Box>
						
						<Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>
							Link to Different Observatory
						</Typography>
					</>
				) : null}
				
				{options.length > 0 ? (
					<>
						<Dropdown
							onChange={handleChange}
							options={options}
							value={selectedInstance?.value ?? ""}
							width="100%"
							label={
								selectedInstance?.label
									? selectedInstance?.label
									: "Select an observatory"
							}
						/>
						<Button
							disabled={isLoading || !selectedInstance}
							onClick={() => submit?.(selectedInstance?.value)}
							variant="outlined"
							sx={{
								margin: "1rem auto 0",
							}}
						>
							{s.general.connect}
						</Button>
					</>
				) : (
					<Typography>
						{linkedInstance 
							? "No other active instances available to link" 
							: "No active instances detected, please make sure KStars is connected and doesn't linked to any observatory"
						}
					</Typography>
				)}
			</Paper>
		</Modal>
	);
};

export default ObservatoryLinkModal;
