import React from "react";
import debounce from "lodash/debounce";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { useAdminContext } from "./AdminTabContext";
import { Palette } from "@common/shared/common/styles";

const SearchInput = ({ action, delay = 1000, placeholder = "Search" }) =>
{
	const { usernameFilter } = useAdminContext();

	return (
		<TextField
			size="small"
			autoFocus
			placeholder={placeholder}
			InputProps={{
				startAdornment: (
					<InputAdornment position="start">
						<SearchIcon style={{ color: Palette.white }} />
					</InputAdornment>
				),
				sx: { color: Palette.white },
			}}
			onChange={debounce((e) => action(e.target.value), delay)}
			onBlur={debounce((e) => action(e.target.value), delay)}
			onKeyDown={(e) =>
			{
				if (e.key !== "Escape")
				{
					e.stopPropagation();
				}
			}}
			defaultValue={usernameFilter}
		/>
	);
};

export default SearchInput;
