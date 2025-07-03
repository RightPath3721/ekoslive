import { Box, Typography } from "@mui/material";
import { get, isEmpty } from "lodash";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import React, { memo, useEffect, useState } from "react";
import { formatBytes } from "@common/shared/common/common";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import CreatableSelect from "react-select/creatable";
import RenderFileInfo from "@components/RenderFileInfo";

dayjs.extend(utc);
dayjs.extend(timezone);

const createOption = (label) => ({
	label,
	value: label,
});

const createTagsStyles = (styles) => (baseStyles) => ({
	...baseStyles,
	...styles,
});

const InfoViewer = ({ data, onTagAdd, onTagRemove, showTags = true }) =>
{
	const [state, setState] = useState({
		uuid: null,
		tags: [],
	});
	const [inputValue, setInputValue] = useState("");

	const handleKeyDown = (event) =>
	{
		if (!inputValue) return;
		switch (event.key) {
			case "Enter":
			case "Tab":
			case " ":
				handleTagsUpdated([...state.tags, createOption(inputValue)]);
				setInputValue("");
				event.preventDefault();
				return;
			default:
				return;
		}
	};

	const metadata = data?.metadata || {};
	const {
		filename = '',
		filter = '',
		exptime = 0,
		ts = '',
		filesize = 0,
		xbinning = 0,
		ybinning = 0,
		tags = [],
		frame = '',
	} = metadata;

	const uuid = data?.uuid;
	let formatted_exptime = exptime;
	if (formatted_exptime > 1) formatted_exptime = formatted_exptime?.toFixed(1);
	else if (formatted_exptime < 0.001)
		formatted_exptime = formatted_exptime?.toFixed(6);
	else formatted_exptime = formatted_exptime?.toFixed(3);
	let temperature = get(data, "ccd-temp", null);
	if (temperature == null) temperature = "NA";
	else temperature = temperature?.toFixed(2);

	const capturedOn = dayjs.utc(ts).tz().format("YYYY-MM-DD HH:mm:ss");
	const leftSide = {
		label: [
			s.general.filename,
			s.general.size,
			s.general.frame,
			s.general.binning,
			s.cloud.info_drawer.captured_on,
			s.general.filter,
			s.general.exposure,
			s.general.temperature,
		],
	};
	const rightSide = {
		text: [
			filename,
			formatBytes(filesize),
			frame,
			`${xbinning}x${ybinning}`,
			`${capturedOn}`,
			isEmpty(filter) ? "NA" : filter,
			formatted_exptime,
			temperature,
		],
	};
	useEffect(() =>
	{
		if (!isEmpty(data))
		{
			setState({ ...state, uuid, tags: [...(tags ?? [])] });
		}
	}, []);

	const handleTagsUpdated = (newTags) =>
	{
		const addedTags = newTags.filter((tag) => !state.tags.includes(tag));
		const removedTags = tags.filter((tag) => !newTags.includes(tag));

		if (addedTags && Array.isArray(addedTags)) {
			addedTags.forEach((tag) =>
			{
				onTagAdd(tag);
			});
		}

		if (removedTags && Array.isArray(removedTags)) {
			removedTags.forEach((tag) =>
			{
				onTagRemove(tag);
			});
		}

		setState({ ...state, tags: [...newTags] });
	};

	return (
		<>
			{showTags && (
				<Box
					sx={[
						styles.row,
						{
							gap: "8px",
							alignItems: "center",
							paddingInline: "12px",
							paddingTop: "12px",
						},
					]}
				>
					<Typography
						sx={[styles.text, { marginRight: "20px", fontSize: "14px" }]}
					>
						{s.general.tags}
					</Typography>
					<CreatableSelect
						inputValue={inputValue}
						isClearable
						isMulti
						menuIsOpen={false}
						onChange={(newValue) => handleTagsUpdated(newValue)}
						onInputChange={(newValue) => setInputValue(newValue)}
						onKeyDown={handleKeyDown}
						placeholder={s.cloud.info_drawer.add_tags_here}
						value={state.tags}
						styles={{
							container: createTagsStyles(LOCAL_STYLES.tagsInput),
							input: createTagsStyles(LOCAL_STYLES.tagsInput),
							placeholder: createTagsStyles({ color: Palette.grey66 }),
							dropdownIndicator: createTagsStyles({ display: "none" }),
							indicatorsContainer: createTagsStyles({ display: "none" }),
							indicatorSeparator: createTagsStyles({ display: "none" }),
							multiValue: createTagsStyles({
								backgroundColor: Palette.grey33,
								borderRadius: "4px",
							}),
							multiValueLabel: createTagsStyles({
								...styles.text,
								color: Palette.white,
								fontSize: "14px",
							}),
							multiValueRemove: (baseStyles) => ({
								...baseStyles,
								":hover": { background: Palette.grey99 },
							}),
							control: (baseStyles, state) => ({
								...baseStyles,
								...LOCAL_STYLES.tagsInput,
								borderBottomWidth: "1px",
								borderBottomColor: Palette.grey99,
								border: state.isFocused ? "1px" : "0px",
								outline: "none",
								boxShadow: state.isFocused ? 0 : 0,
								":hover": {
									borderColor: state.isFocused ? Palette.grey99 : "transparent",
								},
							}),
						}}
					/>
				</Box>
			)}
			<RenderFileInfo data={leftSide} text={rightSide} />
		</>
	);
};

export default memo(InfoViewer);

const LOCAL_STYLES = {
	tagsContainer: {
		marginHorizontal: "24px",
		flex: 1,
	},
	tagsInput: {
		backgroundColor: Palette.grey22,
		borderBottomColor: Palette.grey99,
		color: Palette.greycc,
		fontSize: "16px",
		fontFamily: "Roboto",
	},
	tagContainer: {
		backgroundColor: Palette.grey33,
	},
	tagText: {
		color: Palette.greycc,
		fontSize: "16px",
	},
};
