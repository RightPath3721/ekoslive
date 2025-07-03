import React, { useEffect } from "react";
import isEmpty from "lodash/isEmpty";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import { useAcquisitionContext } from "./AcquisitionTabContext";
import IntegrationTimeCounter from "./IntegrationTimeCounter";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { useTheme } from "@mui/material/styles";

const FilterSelector = () =>
{
	const { filter, setFilter, filtersList } = useAcquisitionContext();
	const { palette } = useTheme();
	useEffect(() =>
	{
		if (filtersList.length > 0)
		{
			setFilter(filtersList[0]);
		}
		else
		{
			setFilter("no_filter");
		}
	}, [filtersList, setFilter]);

	const handleChange = (_, newValue) =>
	{
		if (newValue === null && filter === "no_filter") {
			return;
		}
		
		if (newValue === "no_filter" || newValue === null) {
			setFilter("no_filter");
		} else {
			setFilter(filtersList.find((filter) => filter._id === newValue));
		}
	};

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: ".5rem",
				alignItems: "flex-start",
				marginTop: "1.25rem",
				gridColumn: "1 / 3",
			}}
		>
			<Typography>{s.general.filter}</Typography>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					width: "100%",
				}}
			>
				<Box sx={{ 
					maxWidth: "calc(100% - 125px)", 
				}}>
					<Tabs
						value={filter === "no_filter" ? "no_filter" : filter?._id ?? ""}
						onChange={handleChange}
						variant="scrollable"
						scrollButtons
						allowScrollButtonsMobile
						aria-label="Filter tabs"
						sx={{
							'& .MuiTab-root': {
								marginRight: "0.5rem",
								minHeight: "32px",
							},
							"& .MuiTabs-indicator": {
								backgroundColor: "transparent",
							},
							"& .MuiTab-root": {
								color: palette.white[900],
								borderRadius: "25px",
							},
							"& .MuiTab-root.Mui-selected": {
								color: palette.white[900], // Color for the selected tab
								background: palette.primary.main,
								borderRadius: "25px",
							},
							"& .MuiTabs-scrollButtons": {
								color: palette.white[900],
								"& .MuiSvgIcon-root": {
									fontSize: "2rem"
								}
							}
						}}
					>
						{isEmpty(filtersList) ? (
							<Tab 
								label={s.general.no_filter}
								value="no_filter"
							/>
						) : (
							filtersList?.map((filter) => (
								<Tab
									key={filter._id}
									label={filter.label}
									value={filter._id}
									sx={{
										'& .MuiTab-wrapper': {
											whiteSpace: "nowrap",
											overflow: "hidden",
											textOverflow: "ellipsis",
										}
									}}
								/>
							))
						)}
					</Tabs>
				</Box>
				<IntegrationTimeCounter />
			</Box>
		</Box>
	);
};

export default FilterSelector;
