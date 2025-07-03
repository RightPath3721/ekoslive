import React, { useCallback, useState } from "react";
import { useActivate } from "react-activation";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import FilledInput from "@mui/material/FilledInput";
import s from "@common/shared/i18n/i18n";
import FilterIcon from "@client/icons/FilterIcon";
import FilterSettingsIcon from "@client/icons/FilterSettingsIcon";
import { styles } from "@client/shared/styles";
import { Palette } from "@common/shared/common/styles";
import SortDirection from "./SortDirection";
import AdditionalFilters from "./AdditionalFilters";
import useThrottledEffect from "@hooks/useThrottledEffect";

const Filters = ({
	fetchData,
	filtersData,
	setPage,
	setSortDirection,
	page,
	prefix,
	resetPageOnSortChange = false,
	...rest
}) =>
{
	const [filters, setFilters] = useState({
		search: "",
		sort_direction: "asc",
		sort_by: "social_nickname",
	});
	const [isAdditionalFiltersOpen, setIsAdditionalFiltersOpen] = useState(false);

	const fetch = useCallback(() =>
	{
		fetchData?.({ ...filters, ...rest });
	}, [filters, page, fetchData]);

	useThrottledEffect(fetch, 1500, [filters, page, fetchData]);
	useActivate(() =>
	{
		fetchData(filters);
	});

	const toggleSortDirection = useCallback(
		(direction) =>
		{
			setSortDirection(direction);
			setFilters((prevData) => ({ ...prevData, sort_direction: direction }));
			if (resetPageOnSortChange) setPage(0);
		},
		[setFilters, resetPageOnSortChange, setPage],
	);

	const handleFilterChange = useCallback(
		(key, value) =>
		{
			setFilters((prevData) => ({ ...prevData, [key]: value }));
			setPage?.(0);
		},
		[setPage, setFilters],
	);

	const resetFilters = useCallback(() =>
	{
		setFilters((prevFilters) => ({
			sort_direction: prevFilters.sort_direction,
			search: "",
			sort_by: "social_nickname",
		}));
		setPage?.(0);
	}, [setFilters]);

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				gap: "1.5rem",
				width: "100%",
			}}
			id="search_filter"
		>
			<Box sx={[styles.center, { gap: ".5rem" }]}>
				{filtersData?.length > 0 && (
					<IconButton
						id="search_filter"
						onClick={() => setIsAdditionalFiltersOpen((prev) => !prev)}
						sx={{
							padding: ".5rem",
							backgroundColor: "#3C3B3B3B",
							borderRadius: "50%",
							color: "#CECECE",
							":hover": {
								color: Palette.orange,
							},
						}}
					>
						<FilterIcon height={20} width={20} color="currentColor" />
					</IconButton>
				)}
				<FilledInput
					id="search_live"
					value={filters.search}
					onChange={(e) => handleFilterChange("search", e.target.value)}
					sx={{ position: "relative" }}
					placeholder={s.general.search}
				/>

				<IconButton
					id="search_advanced"
					sx={{
						padding: ".5rem",
						backgroundColor: "#3C3B3B3B",
						borderRadius: "50%",
						color: "#CECECE",
						cursor: "not-allowed",
					}}
				>
					<FilterSettingsIcon height={20} width={20} color="currentColor" />
				</IconButton>

				<SortDirection
					direction={filters.sort_direction ?? "desc"}
					setDirection={toggleSortDirection}
				/>
			</Box>
			{isAdditionalFiltersOpen && (
				<AdditionalFilters
					filters={filters}
					handleFilterChange={handleFilterChange}
					filtersList={filtersData}
					prefix={prefix}
					resetFilters={resetFilters}
				/>
			)}
		</Box>
	);
};

export default Filters;
