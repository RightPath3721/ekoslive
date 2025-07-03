import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	cloneElement,
} from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { typeIcons } from "@client/Pages/Community/Profile/Observatory/Equipment/EquipmentBox";
import { debounce } from "lodash";
import { Palette } from "@common/shared/common/styles";
import { ekosliveServer } from "@client/config";
import s from "@common/shared/i18n/i18n";

const ExternalSearch = ({ runExternalSearch }) =>
{
	const [allModels, setAllModels] = useState([]);
	const [selectedObject, setSelectedObject] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [cachedQuery, setCachedQuery] = useState("");
	const [displayedList, setDisplayedList] = useState([]);
	const [currentPage, setCurrentPage] = useState(0);
	const paginationRef = useRef({
		limit: 20,
		hasMore: true,
	});
	const observer = useRef();

	const fetchModels = useCallback(async () =>
	{
		try
		{
			const result = await ekosliveServer.get(
				`/api/equipments/equipment-models-with-populate?page=${currentPage}&limit=${paginationRef.current.limit}&search=${searchQuery}`,
			);

			if (result.data.models)
			{
				if (currentPage === 0)
				{
					setAllModels(result.data.models.models);
					setDisplayedList(result.data.models.models);
				} else
				{
					setAllModels((prevModels) =>
					{
						const combinedModels = [...prevModels, ...result.data.models.models];
						const uniqueModels = Array.from(
							new Map(combinedModels.map((model) => [model._id, model])).values(),
						);
						return uniqueModels;
					});

					setDisplayedList((prevList) =>
					{
						const combinedModels = [...prevList, ...result.data.models.models];
						const uniqueModels = Array.from(
							new Map(combinedModels.map((model) => [model._id, model])).values(),
						);
						return uniqueModels;
					});
				}

				paginationRef.current.hasMore =
					result.data.models.total > (currentPage + 1) * paginationRef.current.limit;
			}
		}
		catch (error)
		{
			console.error("Failed to fetch models:", error);
		}
	}, [currentPage, searchQuery]);

	useEffect(() =>
	{
		if (searchQuery !== cachedQuery)
		{
			setCurrentPage(0);
			setCachedQuery(searchQuery);
		}
		fetchModels();
	}, [searchQuery, currentPage, fetchModels, cachedQuery]);

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

	const debouncedSetSearchQuery = useCallback(
		debounce((value) =>
		{
			setSearchQuery(value);
			setCurrentPage(0);
		}, 500),
		[],
	);

	useEffect(() =>
	{
		return () => debouncedSetSearchQuery.cancel();
	}, [debouncedSetSearchQuery]);

	const recalculateDisplayedList = (query, page) =>
	{
		const limit = paginationRef.current.limit;
		if (!query)
		{
			const filteredModels = allModels.slice(
				page * limit,
				page * limit + limit,
			);
			paginationRef.current.hasMore = !(filteredModels.length < limit);
			return filteredModels;
		}

		const filteredModels = allModels.filter((model) =>
			model.label.toLowerCase().includes(query.toLowerCase()),
		);
		if (filteredModels.length <= limit)
		{
			paginationRef.current = { ...paginationRef.current, hasMore: false };
			return filteredModels;
		}
		const cuttedModels = filteredModels.slice(
			page * limit,
			page * limit + limit,
		);
		paginationRef.current = {
			...paginationRef.current,
			hasMore: !(cuttedModels.length < limit),
		};

		return cuttedModels;
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
			setDisplayedList((prevModels) => [
				...prevModels,
				...recalculateDisplayedList(searchQuery, currentPage),
			]);
		}
	}, [searchQuery, currentPage]);

	return (
		<FormControl
			id="targetSearch"
			sx={{
				width: "40%",
				"&.MuiFormControl-root": {
					borderRadius: "24px",
					padding: "10px",
					paddingLeft: "20px",
					paddingRight: "20px",
				},
				"&.MuiInput-input": {
					padding: "10px",
				},
				backgroundColor: "rgb(29, 29, 29)",
			}}
			variant="standard"
			placeholder="Search..."
		>
			<Select
				MenuProps={{
					autoFocus: false,
					sx: {
						".MuiMenu-paper": {
							backgroundColor: "rgb(29, 29, 29)",
							color: Palette.white,
							"::-webkit-scrollbar": {
								width: "5px",
							},
							"::-webkit-scrollbar-track": {
								WebkitBoxShadow: "inset 0 0 5px rgba(0,0,0,0.00)",
							},
							"::-webkit-scrollbar-thumb": {
								backgroundColor: "rgba(0,0,0,.1)",
								outline: `2px solid ${Palette.contrastGrey}`,
							},
						}
					},
				}}
				labelId="search-select-label"
				id="search-select"
				value={selectedObject?.label || ""}
				onChange={(e) =>
				{
					setSelectedObject(e.target.value);
					runExternalSearch(e.target.value);
				}}
				onClose={() =>
				{
					setSelectedObject("");
				}}
				displayEmpty
				renderValue={() => selectedObject?.label || s.general.search}
				sx={{
					"& .MuiOutlinedInput-input": {
						color: "white",
					},
					"& .MuiSelect-icon": {
						color: Palette.white,
					},
					"& .MuiOutlinedInput-notchedOutline": { borderColor: Palette.grey44 },
					"&.MuiInputBase-root": {
						color: Palette.white70,
					}
				}}
			>
				<ListSubheader
					sx={{
						backgroundColor: "rgb(29, 29, 29)",
						color: Palette.white,
					}}
				>
					<TextField
						size="small"
						autoFocus
						placeholder="Search... e.g.  QHY..."
						fullWidth
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon sx={{ color: Palette.white }} />
								</InputAdornment>
							),
							sx: { color: Palette.white },
						}}
						onChange={(e) => debouncedSetSearchQuery(e.target.value)}
						onKeyDown={(e) =>
						{
							if (e.key !== "Escape")
							{
								e.stopPropagation();
							}
						}}
					/>
				</ListSubheader>
				{displayedList.map((model, i, arr) => (
					<MenuItem
						ref={i === arr.length - 1 ? lastOptionElementRef : null}
						key={i}
						value={model}
						sx={{
							display: "flex",
							gap: "10px",
						}}
					>
						{cloneElement(typeIcons[model.equipment_type?.name || "Mount"], {
							height: 20,
							width: 20,
						})}
						{model.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

export default ExternalSearch;
