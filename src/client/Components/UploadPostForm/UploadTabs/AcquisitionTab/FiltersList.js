import React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { useUploadFormContext } from "../../UploadFormContext";
import Icon from "@components/Icon";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";

const FiltersList = () =>
{
	const { filters, setFilters } = useUploadFormContext();

	return (
		<List sx={{ maxHeight: "200px", overflowY: "auto" }}>
			{filters.map((filter, idx) =>
			{
				return (
					<ListItem
						sx={{
							display: "flex",
							flexDirection: "row",
							justifyContent: "space-between",
							gap: ".5rem",
						}}
						key={`${filter.label}-${idx}-${filter.frames}`}
					>
						<Typography>
							{filter.label}&nbsp;{filter.frames}x{filter.duration}'&nbsp;
							{filter.gain && `(${s.general.gain} ${filter.gain})`}&nbsp;
							{filter.binning && `(${s.general.binning} ${filter.binning})`}
						</Typography>
						<IconButton
							onClick={() =>
								setFilters((prev) => prev.filter((_, i) => idx !== i))
							}
							sx={{ color: Palette.white, padding: 0 }}
						>
							<Icon name="Close" color={Palette.red} size="20px" />
						</IconButton>
					</ListItem>
				);
			})}
		</List>
	);
};

export default FiltersList;
