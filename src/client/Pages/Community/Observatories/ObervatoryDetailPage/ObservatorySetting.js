import React, {
	forwardRef,
	Suspense,
	useCallback,
	useEffect,
	useState,
} from "react";
import Box from "@mui/material/Box";
import useActiveUser from "@hooks/useActiveUser";
import TabsView from "@components/TabsView";
import { styles } from "@client/shared/styles";
import TabLoader from "@components/TabLoader";
import ObservatorySettingRental from "./ObservatorySettingRental";
import ObservatorySettingGeneral from "./ObservatorySettingGeneral";
import ObservatorySettingAnnouncements from "./ObservatorySettingAnnouncements";
import ObservatorySettingGuidelines from "./ObservatorySettingGuidelines";
import { useObservatoryPageContext } from "./ObservatoryPageContext";

export const Lists = {
	GENERAL: 0,
	RENTAL: 1,
	GUIDELINES: 2,
	ANNOUNCEMENTS: 3,
};

const ObservatorySetting = () =>
{
	const user = useActiveUser();
	const [tabValue, setTabValue] = useState(Lists.GENERAL);
	const { observatory } = useObservatoryPageContext();

	const handleTabValueChange = (_, value) =>
	{
		if (value !== null)
		{
			setTabValue(value);
		}
	};

	const tabs = [
		{ value: Lists.GENERAL, label: "General", id: "general" },
		...(observatory?.rentable ? [
			{
				value: Lists.RENTAL,
				label: "Rental",
				id: "rental",
			},
			{
				value: Lists.GUIDELINES,
				label: "Guidelines",
				id: "guidelines",
			}
		] : []),
		{
			value: Lists.ANNOUNCEMENTS,
			label: "Announcements",
			id: "announcements",
		}
	];

	return (
		<Box>
			<Box
				sx={[
					styles.center,
					{
						justifyContent: user ? "space-between" : "flex-end",
						paddingInline: ".75rem",
						paddingBlock: ".5rem",
					},
				]}
			>
				{user && (
					<TabsView
						tabValue={tabValue}
						handleChange={handleTabValueChange}
						tabs={tabs}
						isScrollable={false}
					/>
				)}
			</Box>
			<Suspense fallback={<TabLoader />}>
				{tabValue === Lists.GENERAL && <ObservatorySettingGeneral />}
				{tabValue === Lists.RENTAL && observatory?.rentable && <ObservatorySettingRental />}
				{tabValue === Lists.GUIDELINES && observatory?.rentable && <ObservatorySettingGuidelines />}
				{tabValue === Lists.ANNOUNCEMENTS && <ObservatorySettingAnnouncements />}
			</Suspense>
		</Box>
	);
};

export default ObservatorySetting;
