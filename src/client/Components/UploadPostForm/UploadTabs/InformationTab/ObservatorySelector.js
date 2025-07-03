import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import ToggleButton from "@mui/material/ToggleButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { selectConnectedKStarInstances } from "@redux/selectors";
import ObservatoryBox from "@components/ObservatoryBox";
import { useUploadFormContext } from "../../UploadFormContext";
import useObservatories from "@hooks/useObservatories";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import NoObservatoriesMessage from "./NoObservatoriesMessage";

const ObservatorySelector = () =>
{
	const { observatory, setObservatory, setEquipmentProfile } =
		useUploadFormContext();
	const { observatories } = useObservatories();
	const connectedKStarInstances = useSelector(selectConnectedKStarInstances);

	const handleChange = (_, newObsevatory) =>
	{
		setObservatory(newObsevatory);
		const observatory = observatories.find(
			(item) => item?._id === newObsevatory,
		);
		if (observatory)
		{
			const equipmentProfile = observatory.equipment_profiles[0];
			if (equipmentProfile)
			{
				setEquipmentProfile(equipmentProfile);
			}
		}
	};

	useEffect(() =>
	{
		if (observatories?.length > 0)
		{
			const observatoryId = observatories[0]?._id;
			if (observatoryId)
			{
				setObservatory(observatoryId);

				const equipmentProfile = observatories[0]?.equipment_profiles?.[0];
				if (equipmentProfile)
				{
					setEquipmentProfile(equipmentProfile);
				}
			}
		}
	}, [observatories]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: ".5rem",
				alignItems: "flex-start",
			}}
		>
			<Typography>
				{s.ekos.collapse_observatory.heading}
				<Typography fontSize="1.5rem" component="span" color="error">
					&#42;
				</Typography>
			</Typography>
			{observatories?.length > 0 ? (
				<ToggleButtonGroup
					color="primary"
					value={observatory ?? ""}
					exclusive
					onChange={handleChange}
					aria-label="Observatory"
					sx={{ gap: ".5rem", maxWidth: "100%", overflowX: "scroll" }}
				>
					{observatories?.map((observatory) => (
						<ToggleButton
							sx={{
								color: Palette.white,
								backgroundColor: "#1D1D1D",
								border: "2px solid #CECECE",
								"&.Mui-selected": {
									backgroundColor: Palette.orange,
									color: Palette.white,
								},
								display: "flex",
								flexDirection: "column",
							}}
							key={observatory._id}
							value={observatory._id}
						>
							<ObservatoryBox
								name={observatory.name}
								photo={observatory.photos[0]}
								connected={connectedKStarInstances?.some(
									(item) => item.machineID === observatory?.machine_id,
								)}
							/>
						</ToggleButton>
					))}
				</ToggleButtonGroup>
			) : (
				<NoObservatoriesMessage />
			)}
		</Box>
	);
};

export default ObservatorySelector;
