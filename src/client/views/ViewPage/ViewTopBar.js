import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Button, Typography } from "@mui/material";
import { selectSortDirection, selectActiveSortBy } from "@redux/selectors";
import { viewerActions } from "@redux/actions";
import { viewerConstants } from "@redux/constants";
import { Palette } from "@common/shared/common/styles";
import Icon from "../../Components/Icon";
import Dropdown from "../../Components/Dropdown";
import Refresh from "./Refresh";
import CustomizedSwitch from "../../Components/CustomSwitch";
import AlertDialog from "../../Components/AlertDialog";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../shared/styles";
import StellaFilterInputButton from "../../Components/StellaFilterInputButton";

const options = [
	{ label: "Recent", value: "Recent Images" },
	{ label: "All Image", value: "Show All" },
	{ label: "Target", value: "Target" },
	{ label: "Frame", value: "Frame" },
	{ label: "Date", value: "Date" },
	{ label: "Filter", value: "Filter" },
];

const sortByList = [
	{ label: s.general.name, value: "filename" },
	{ label: s.general.date, value: "ts" },
	{ label: s.general.size, value: "filesize" },
	{ label: s.general.frame, value: "frame" },
	{ label: s.general.filter, value: "filter" },
	{ label: s.general.exposure, value: "exptime" },
];

const ViewTopBar = ({
	setMatchedImages,
	setShowImages,
	foldersType,
	setFoldersType,
	refresh,
	deleteAll,
	imageQuantity,
}) =>
{
	const dispatch = useDispatch();
	const [showDialog, setShowDialog] = useState(false);
	const [showSortBar, setShowSortBar] = useState(false);
	const sortDirection = useSelector(selectSortDirection);
	const sortBy = useSelector((state) =>
		selectActiveSortBy(state, { list: sortByList }),
	);

	const sortDirectionChanged = (value) =>
	{
		dispatch(viewerActions.setOption(viewerConstants.SORT_DIRECTION, value));
	};

	/**
	 * Saves sorting values i.e time, exp, date etc..
	 * @param {string} value - Filter by which images will be sorted.
	 * @returns {void}
	 */
	const sortByChanged = (value) =>
	{
		dispatch(
			viewerActions.setOption(
				viewerConstants.SORT_FILTER,
				sortByList.indexOf(value),
			),
		);
	};

	return (
		<>
			<Box
				sx={[styles.row, { justifyContent: "space-between", padding: "10px" }]}
			>
				<Button
					disabled={
						foldersType.label === "Recent" || foldersType.label === "All image"
					}
					onClick={() =>
					{
						setMatchedImages([]);
						setShowImages(false);
					}}
					sx={{ display: "flex" }}
				>
					<Icon name="arrow-left" color="white" />
				</Button>
				<Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
					<StellaFilterInputButton
						setMatchedImages={setMatchedImages}
						mode="view"
					/>

					<Dropdown
						options={options}
						value={foldersType.label}
						onChange={(data) =>
						{
							setFoldersType(data);
							setShowImages(false);
						}}
						width="140px"
					/>
					<Button
						sx={{
							backgroundColor: showSortBar ? Palette.orange : Palette.grey33,
							color: Palette.white,
							textTransform: "capitalize",
							height: "40px",
						}}
						onClick={() => setShowSortBar((prevState) => !prevState)}
					>
						{s.cloud.gallery_drawer.btn_sort.toLowerCase()}
					</Button>
					<Refresh refresh={refresh} />
					<Button
						sx={{
							height: "40px",
							background: Palette.red,
							color: Palette.white,
							textTransform: "capitalize",
						}}
						onClick={() => setShowDialog(true)}
					>
						{s.cloud.gallery_drawer.btn_delete_all.toLowerCase()}
					</Button>
				</Box>
			</Box>
			{showSortBar && (
				<Box sx={[LOCAL_STYLES.sortBar]}>
					<Box sx={{ width: "300px" }}>
						<Dropdown
							options={sortByList}
							value={sortBy.label}
							onChange={sortByChanged}
							width="300px"
						/>
					</Box>
					<Box sx={[styles.center, { flexDirection: "row", gap: "10px" }]}>
						<CustomizedSwitch
							options={[
								{ label: s.cloud.gallery_drawer.ascending, value: 0 },
								{ label: s.cloud.gallery_drawer.descending, value: 1 },
							]}
							value={sortDirection}
							onChange={sortDirectionChanged}
						/>
						{imageQuantity > 0 && (
							<Box sx={[styles.row, { alignItems: "center" }]}>
								<Typography
									sx={[LOCAL_STYLES.resultCount, { color: Palette.white }]}
								>
									{foldersType.label === "Recent"
										? imageQuantity >= 20
											? "20"
											: imageQuantity
										: imageQuantity}
								</Typography>
								<Typography
									sx={[LOCAL_STYLES.subtext, { color: Palette.white }]}
								>
									{s.cloud.gallery_drawer.images}
								</Typography>
							</Box>
						)}
					</Box>
				</Box>
			)}
			<AlertDialog
				handleDelete={async () =>
				{
					await deleteAll();
					refresh();
					setShowDialog(false);
				}}
				show={showDialog}
				close={() => setShowDialog(false)}
				title={s.general.alert_confirmation_title}
				description={s.formatString(
					s.cloud.gallery_drawer.alert_delete_all_body,
					imageQuantity,
				)}
			/>
		</>
	);
};

const LOCAL_STYLES = {
	sortBar: {
		display: "flex",
		paddingBlock: "16px",
		paddingInline: "24px",
		borderBottomWidth: 1,
		borderBottomColor: Palette.grey44,
		backgroundColor: Palette.grey22,
		justifyContent: "space-around",
	},
	resultCount: {
		fontSize: "24px",
		lineHeight: "40px",
		marginLeft: "10px",
		marginRight: "4px",
	},
	subtext: {
		fontSize: "14px",
		paddingTop: "4px",
	},
};

export default ViewTopBar;
