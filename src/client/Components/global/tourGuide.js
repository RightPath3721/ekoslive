import React, { useCallback, useEffect, useState } from "react";
import Tour from "reactour";
import { useTheme } from "@mui/material";
import useActiveUser from "@hooks/useActiveUser";
import { useTourGuideContext } from "@components/providers/TourGuideProvider";

const stepStyle = {
	color: "#666",
	background: "#ddddd",
};

const tourGuide = (WrappedComponent, { steps, key, initialStepKey }) =>
{
	return (props) =>
	{
		const user = useActiveUser();
		const { palette } = useTheme();
		const { tourGuideState, updateTourGuideState } = useTourGuideContext();
		const [isTourOpen, setIsTourOpen] = useState(false);

		useEffect(() =>
		{
			if (!tourGuideState) return;

			if (initialStepKey)
			{
				const hasCompletedInitialGuide =
					tourGuideState?.tour_guide?.[initialStepKey] ?? false;
				const hasCompletedTourGuide =
					tourGuideState?.detailed_tour_guide?.[key] ?? false;
				setIsTourOpen(hasCompletedInitialGuide && !hasCompletedTourGuide);
			}
			else
			{
				setIsTourOpen(!tourGuideState?.detailed_tour_guide?.[key] ?? true);
			}
		}, [tourGuideState]);

		const handleTourClose = useCallback(async () =>
		{
			setIsTourOpen(false);
			updateTourGuideState(key);
		}, [updateTourGuideState, user]);


		return (
			<>
				{(typeof props.active === "boolean" && props.active) && 
					<Tour
						steps={steps.map((step) => ({ ...step, style: stepStyle }))}
						isOpen={isTourOpen}
						rounded={5}
						stepInteraction={true}
						maskClassName="mask"
						accentColor={palette.primary.main}
						onRequestClose={handleTourClose}
					/>
				}
				<WrappedComponent {...props} />
			</>
		);
	};
};

export default tourGuide;
