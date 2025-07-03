import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import FilledInput from "@mui/material/FilledInput";
import Checkbox from "@mui/material/Checkbox";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import DistanceSlider from "./DistanceFilter";
import MinimumDistanceSlider from "@components/MinimumDistanceSlider";
import { Button, useTheme } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import DropSearchableDown from "@components/DropSearchableDown";

const AdditionalFilters = ({
	filters,
	handleFilterChange,
	filtersList,
	prefix,
	resetFilters,
}) =>
{
	const { palette } = useTheme();
	const [filterDatas, setFilterDatas] = useState(filters);
	const [initialFilters, setInitialFilters] = useState(null);

	useEffect(() =>
	{
		setInitialFilters(filters);
	}, []);

	// Function to reset filters to their initial values from ref
	const handleFiltersReset = () =>
	{
		setFilterDatas(initialFilters);
		Object.keys(initialFilters)?.forEach((key) =>
		{
			handleFilterChange(key, initialFilters[key]);
		});
		resetFilters?.();
	};

	// Function to handle individual filter change and update the state
	const changeFilter = (key, value) =>
	{
		setFilterDatas((prev) => ({ ...prev, [key]: value }));
		handleFilterChange(key, value);
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xxs: "1fr", md: "repeat(2, 1fr)" },
				columnGap: ".5rem",
				rowGap: ".75rem",
				padding: { xxs: ".75rem", md: "1.5rem" },
			}}
		>
			{filtersList?.map((filter) =>
			{
				const key = filter.path
					? filter.path
					: prefix
						? `${prefix}.${filter.key}`
						: filter.key;
				if (key === "location")
				{
					return (
						<Box
							sx={{
								display: "grid",
								alignItems: "center",
								gridTemplateColumns: "124px 1fr",
								gridColumn: { xxs: "auto", md: "1 / 3" },
							}}
							key={key}
						>
							<Typography variant="body2">
								{filter.label}
								{filter.unit && (
									<Typography component="span">
										&nbsp;&#40;{filter.unit}&#41;
									</Typography>
								)}
							</Typography>
							<DistanceSlider handleFilterChange={changeFilter} />
						</Box>
					);
				}
				switch (filter.type) {
					case "Number":
						return (
							<Box
								sx={{
									display: "grid",
									alignItems: "center",
									gridTemplateColumns: "124px 1fr",
									gridColumn: { xxs: "auto", md: "1 / 3" },
								}}
								key={key}
							>
								<Typography variant="body2">
									{filter.label} {filter.unit && `(${filter.unit})`}
								</Typography>
								<MinimumDistanceSlider
									minDistance={filter.step}
									value={[
										filterDatas[key]?.[0] ?? (filter.range?.min || 0),
										filterDatas[key]?.[1] ?? (filter.range?.max || 100),
									]}
									setValue={(value) => changeFilter(key, value)}
									step={filter.range?.step ?? 1}
									max={filter.range?.max}
									min={filter.range?.min}
									unit={filter.unit}
								/>
							</Box>
						);
					case "String":
						return (
							<Box
								sx={{
									display: "grid",
									alignItems: "center",
									gridTemplateColumns: "124px 1fr",
								}}
								key={key}
							>
								<Typography variant="body2">{filter.label}</Typography>
								<FilledInput
									type="text"
									value={filterDatas[key] ?? ""}
									onChange={(e) => changeFilter(key, e.target.value)}
									name={key}
								/>
							</Box>
						);

					case "Boolean":
						return (
							<Box
								sx={{
									display: "grid",
									alignItems: "center",
									gridTemplateColumns: "124px 1fr",
								}}
								key={key}
							>
								<Typography variant="body2">{filter.label}</Typography>
								<Checkbox
									checked={filterDatas[key] ?? false}
									onChange={(e) => changeFilter(key, e.target.checked)}
									name={key}
								/>
							</Box>
						);

					case "Dropdown":
						let options;
						let flag = true;
						try
						{
							// Attempt to parse filter.options assuming it's a JSON string
							options = JSON.parse(filter.options);
							flag = false;
						}
						catch
						{
							// If parsing throws an error, assign filter.options directly
							options = filter.options;
						}

						return (
							<Box
								sx={{
									display: "grid",
									alignItems: "center",
									gridTemplateColumns: "124px 1fr",
								}}
								key={filter.key}
							>
								<Typography variant="body2">{filter.label}</Typography>

								{flag ? (
									<DropSearchableDown
										sx={{ width: "100%" }}
										options={options}
										value={filterDatas[key]}
										handleChange={(_, value) => changeFilter(key, value)}
									/>
								) : (
									<Select
										name={key}
										onChange={(e) => changeFilter(key, e.target.value)}
										value={filterDatas[key] ?? []}
										multiple
										SelectDisplayProps={{
											style: { color: palette.common.white },
										}}
										MenuProps={{
											autoFocus: false,
											sx: {
												".MuiMenu-paper": {
													backgroundColor: "rgb(29, 29, 29)",
													color: palette.common.white,
													"::-webkit-scrollbar": {
														width: "5px",
													},
													"::-webkit-scrollbar-track": {
														WebkitBoxShadow: "inset 0 0 5px rgba(0,0,0,0.00)",
													},
													"::-webkit-scrollbar-thumb": {
														backgroundColor: "rgba(0,0,0,.1)",
														outline: `2px solid ${palette.common.white}`,
													},
												},
											},
										}}
										sx={{
											width: "100%",
											"& .MuiOutlinedInput-notchedOutline": {
												borderColor: palette.common.white,
											},
											"& .MuiOutlinedInput": {
												borderColor: palette.common.white,
											},
											"& .MuiSelect-icon": {
												color: palette.common.white,
											},
										}}
									>
										{options.map((option) =>
											{
											const keys = Object.keys(option);
											const label = option.name ?? option.label;
											const value =
												option[
													keys.filter(
														(val) => val !== "name" && val !== "label",
													)
												];

											return (
												<MenuItem
													sx={{ color: "white" }}
													value={value}
													key={value}
												>
													{label}
												</MenuItem>
											);
										})}
									</Select>
								)}
							</Box>
						);
					default:
						return null;
				}
			})}
			<Box
				sx={{
					gridColumn: { xxs: "auto", md: "1 / 3" },
					display: "flex",
					justifyContent: { xxs: "center", md: "flex-end" },
				}}
			>
				<Button variant="outlined" onClick={handleFiltersReset}>
					{s.general.reset}
				</Button>
			</Box>
		</Box>
	);
};

export default AdditionalFilters;
