import React, { useState, useEffect, useRef, useCallback } from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { debounce } from "lodash";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";

const ExternalSearch = ({ runExternalSearch }) =>
{
	const allOptions = JSON.parse(localStorage.getItem("astro_names") ?? "[]");
	const [selectedObjectName, setSelectedObjectName] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [cachedQuery, setCachedQuery] = useState("");
	const [displayedList, setDisplayedList] = useState([]);
	const [currentPage, setCurrentPage] = useState(0);
	const paginationRef = useRef({
		limit: 100,
		hasMore: true,
	});
	const observer = useRef();

	const lastOptionElementRef = useCallback((node) =>
	{
		if (observer.current) observer.current.disconnect();
		observer.current = new IntersectionObserver((entries) =>
		{
			if (entries[0].isIntersecting && paginationRef.current.hasMore)
			{
				setCurrentPage((prevPage) => prevPage + 1);
			}
		});
		if (node) observer.current.observe(node);
	}, []);

	const recalculateDisplayedList = (query, page) =>
	{
		const limit = paginationRef.current.limit;
		if (!query)
		{
			const filteredOptions = allOptions.slice(
				page * limit,
				page * limit + limit,
			);
			paginationRef.current.hasMore = !(filteredOptions.length < limit);
			return filteredOptions;
		}

		const filteredOptions = allOptions.filter((option) =>
			option.toLowerCase().includes(query.toLowerCase()),
		);
		if (filteredOptions.length <= limit)
		{
			paginationRef.current = { ...paginationRef.current, hasMore: false };
			return filteredOptions;
		}
		const cuttedOptions = filteredOptions.slice(
			page * limit,
			page * limit + limit,
		);
		paginationRef.current = {
			...paginationRef.current,
			hasMore: !(cuttedOptions.length < limit),
		};

		return cuttedOptions;
	};

	useEffect(() =>
	{
		if (!searchQuery && cachedQuery)
		{
			setCurrentPage(0);
			setCachedQuery("");
			setDisplayedList(recalculateDisplayedList("", 0));
		}
		else if (!searchQuery && !cachedQuery)
		{
			setDisplayedList((prevList) => [
				...prevList,
				...recalculateDisplayedList("", currentPage),
			]);
		}
		else if (
			(searchQuery && !cachedQuery) ||
			(searchQuery && searchQuery !== cachedQuery)
		)
		{
			setCachedQuery(searchQuery);
			setDisplayedList(recalculateDisplayedList(searchQuery, 0));
		}
		else if (searchQuery === cachedQuery)
		{
			setDisplayedList((prevOptions) => [
				...prevOptions,
				...recalculateDisplayedList(searchQuery, currentPage),
			]);
		}
	}, [searchQuery, currentPage]);

	return (
		<FormControl
			id="targetSearch"
			sx={{
				width: "250px",
				".MuiFormLabel-root.MuiInputLabel-root.Mui-focused": { color: "white" },
			}}
		>
			<InputLabel sx={{ color: Palette.white70 }} id="search-select-label">
				{s.targets.search}
			</InputLabel>
			<Select
				MenuProps={{
					autoFocus: false,
					sx: {
						".MuiMenu-paper": {
							backgroundColor: "rgb(29, 29, 29)",
							color: Palette.white70,
							"::-webkit-scrollbar": {
								width: "5px",
							},
							"::-webkit-scrollbar-thumb": {
								backgroundColor: "rgba(0,0,0,.1)",
								outline: `2px solid ${Palette.contrastGrey}`,
							},
						},
					},
				}}
				labelId="search-select-label"
				id="search-select"
				value={selectedObjectName || ""}
				label={s.targets.search}
				onChange={(e) =>
				{
					setSelectedObjectName(e.target.value);
					runExternalSearch(e.target.value);
				}}
				onClose={() =>
				{
					// Only reset search query, do not reset selectedObjectName
					setSearchQuery("");
				}}
				renderValue={(value) => value || s.targets.search} // Fallback to label if empty
				sx={{
					"& .MuiOutlinedInput-input": {
						color: Palette.white70,
					},
					"& .MuiSelect-icon": {
						color: Palette.white70,
					},
					"& .MuiOutlinedInput-notchedOutline": { borderColor: Palette.grey44 },
				}}
			>
				<ListSubheader
					sx={{
						backgroundColor: "rgb(29, 29, 29)",
						color: Palette.white70,
					}}
				>
					<TextField
						size="small"
						autoFocus
						placeholder="Search... e.g. M 31"
						fullWidth
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
							sx: { color: Palette.white70 },
						}}
						onChange={debounce((e) => setSearchQuery(e.target.value), 1000)}
						onBlur={debounce((e) => setSearchQuery(e.target.value), 1000)}
						onKeyDown={(e) =>
						{
							if (e.key !== "Escape")
							{
								e.stopPropagation();
							}
						}}
					/>
				</ListSubheader>
				{displayedList.map((option, i, arr) => (
					<MenuItem
						ref={i === arr.length - 1 ? lastOptionElementRef : null}
						key={i}
						value={option}
					>
						{option}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

export default ExternalSearch;
