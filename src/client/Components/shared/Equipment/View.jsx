import React, { useState, useCallback, memo } from "react";
import { useSelector } from "react-redux";
import Box from "@mui/material/Box";
import ListView from "./ListView";
import GridView from "./GridView";
import Filters from "@components/Filters/Filters";
import ToggleViewButtons from "@components/ToggleViewButtons";
import useScrollPagination from "@hooks/useScrollPagination";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { Can } from "@components/providers/AclProvider";
import s from "@common/shared/i18n/i18n";
import { ekosliveServer } from "@client/config";
import { selectUser } from "@redux/selectors";

const View = ({
	setShowModal,
	datas,
	handleClick,
	type,
	equipmentType,
	fetchDatas,
	itemsRemaining,
	setPage,
	currentPage,
	setEditData,
	setData,
}) =>
{
	const user = useSelector(selectUser);
	const [view, setView] = useState("grid");
	const [selectedItems, setSelectedItems] = useState([]);
	const { observeRef } = useScrollPagination({
		setPage,
		itemsRemaining,
	});

	const toggleView = useCallback(
		() => setView((p) => (p === "grid" ? "list" : "grid")),
		[setView],
	);

	const [anchorEl, setAnchorEl] = useState(null);
	const [sortDirection, setSortDirection] = useState("asc");
	const open = Boolean(anchorEl);

	const defaultData = () =>
	{
		return [...datas].sort((a, b) =>
		{
			const fieldA = a.name || a.label || "";
			const fieldB = b.name || b.label || "";

			if (fieldA < fieldB)
			{
				return sortDirection === "asc" ? -1 : 1;
			}
			if (fieldA > fieldB)
			{
				return sortDirection === "asc" ? 1 : -1;
			}
			return 0;
		});
	};

	// Initialize state with sorted data
	const sortedDatas = defaultData();

	const handleToggle = (event) =>
	{
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () =>
	{
		setAnchorEl(null);
	};

	const handleEdit = () =>
	{
		const findSelectedItem = (selectedItems, datas) =>
		{
			if (selectedItems.length > 0)
			{
				const selectedItemId = selectedItems[0];
				return datas.find((item) => item._id === selectedItemId);
			}
			return null;
		};
		setEditData(() => findSelectedItem(selectedItems, datas));
		setShowModal(true);
		setSelectedItems([]);
		handleClose();
	};

	const handleModeration = async (moderation) =>
	{
		if (!user) return null;

		const result = await ekosliveServer.post(
			`/api/equipments/moderation?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			{
				type: type,
				action: moderation,
				items: selectedItems,
			},
		);
		if (result)
		{
			setData((prevData) =>
				prevData.filter((item) => !selectedItems.includes(item._id)),
			);
			setSelectedItems([]);
		}
		handleClose();
	};

	return (
		<>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "1.725rem",
					width: "100%",
					marginTop: { xxs: "2rem", xs: "2.5rem", md: "3.5rem", lg: 0 },
					paddingInline: { xxs: ".75rem", sm: "1rem", lg: "1.5rem" },
				}}
			>
				<Box sx={{ width: "60%" }}>
					<Filters
						fetchData={fetchDatas}
						filtersData={equipmentType?.fields
							?.filter((item) => ["Number", "Dropdown"].includes(item.type))
							.sort((a, b) =>
							{
								if (a.type === "Dropdown" && b.type !== "Dropdown")
								{
									return -1; // "Dropdown" should come first
								}
								if (a.type !== "Dropdown" && b.type === "Dropdown")
								{
									return 1; // "Dropdown" should come first
								}
								return 0;
							})}
						prefix="optional_fields"
						page={currentPage}
						setPage={setPage}
						setSortDirection={setSortDirection}
					/>
				</Box>

				<Can action="update" subject="ModeratingStatus">
					<div>
						<Button
							sx={{ display: selectedItems.length > 0 ? "display" : "none" }}
							id="demo-customized-button"
							aria-controls={open ? "demo-customized-menu" : undefined}
							aria-haspopup="true"
							aria-expanded={open ? "true" : undefined}
							variant="outlined"
							disableElevation
							onClick={handleToggle}
							endIcon={<KeyboardArrowDownIcon />}
						>
							{s.menu.go_to_moderation}
						</Button>
						<Menu
							id="basic-menu"
							anchorEl={anchorEl}
							open={open}
							onClose={handleClose}
							MenuListProps={{
								"aria-labelledby": "basic-button",
							}}
						>
							<MenuItem
								onClick={handleEdit}
								disableRipple
								disabled={selectedItems.length !== 1}
							>
								<EditIcon sx={{ pr: "5px" }} />
								{s.general.edit}
							</MenuItem>
							<MenuItem
								onClick={() => handleModeration("unpublish")}
								disableRipple
							>
								<RemoveCircleOutlineIcon sx={{ pr: "5px" }} />
								{s.general.unpublish}
							</MenuItem>
							<MenuItem onClick={() => handleModeration("trash")} disableRipple>
								<DeleteOutlineIcon sx={{ pr: "5px" }} />
								{s.general.trash}
							</MenuItem>
							<MenuItem
								onClick={() => handleModeration("blacklist")}
								disableRipple
							>
								<DeleteOutlineIcon sx={{ pr: "5px" }} />
								{s.general.blacklist}
							</MenuItem>
						</Menu>
					</div>
				</Can>
				<ToggleViewButtons toggleView={toggleView} view={view} />
			</Box>
			{view === "list" ? (
				<ListView
					ref={observeRef}
					type={type}
					setShowModal={setShowModal}
					datas={sortedDatas}
					handleClick={handleClick}
					selectedItems={selectedItems}
					setSelectedItems={setSelectedItems}
				/>
			) : (
				<GridView
					ref={observeRef}
					type={type}
					setShowModal={setShowModal}
					datas={sortedDatas}
					handleClick={handleClick}
				/>
			)}
		</>
	);
};

export default memo(View);
