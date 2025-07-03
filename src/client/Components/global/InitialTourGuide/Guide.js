import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import Tour from "reactour";
import { useTourGuideContext } from "@components/providers/TourGuideProvider";
import defaultSteps from "./steps";

const Guide = ({ stepKey, isOpen, setIsOpen }) =>
{
	const { palette } = useTheme();

	const [isLoading, setIsLoading] = useState(true);
	const { tourGuideState, updateTourGuideState } = useTourGuideContext();
	const [steps, setSteps] = useState([]);

	useEffect(() =>
	{
		if (!tourGuideState) return;

		const steps = defaultSteps[stepKey];

		if (steps?.length > 0)
		{
			setSteps(steps);
			setIsOpen(true);
		}
		else
		{
			setSteps([]);
			setIsOpen(false);
		}

		setIsLoading(false);
	}, [stepKey]);

	if (isLoading) return null;

	return (
		<Tour
			isOpen={isOpen}
			onRequestClose={async () =>
			{
				await updateTourGuideState(stepKey, true);

				setIsOpen(false);
			}}
			steps={steps}
			accentColor={palette.primary.main}
			maskClassName="mask"
			rounded={5}
		/>
	);
};

export default Guide;
