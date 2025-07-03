import React, { useState } from "react";
import { targetsActions } from "@redux/actions";
import { useDispatch, useSelector } from "react-redux";
import { isEmpty } from "lodash";
import { Box, Button, Typography } from "@mui/material";
import Dropdown from "../../Components/Dropdown";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import { selectTargetsListNames } from "@redux/selectors";
import Icon from "../../Components/Icon";
import s from "@common/shared/i18n/i18n";
import InputField from "../../Components/InputField";
import { toast } from "react-toastify";

const ListsBar = ({ activeList, setDisplayList, setActiveList, lists }) =>
{
	const [openNewListBar, setOpenNewListBar] = useState(false);
	const [newListName, setNewListName] = useState("");
	const listNames = useSelector(selectTargetsListNames);

	const [editName, setEditName] = useState(false);
	const dispatch = useDispatch();

	// if adding new lists, display small text instead of dropdown to create a list
	if (openNewListBar)
		return (
			<Box
				sx={[
					styles.row,
					{ alignItems: "center", gap: "5px", justifyContent: "space-between" },
				]}
			>
				<Typography sx={[LOCAL_STYLES.header]}>{s.targets.lists}</Typography>
				<InputField
					value={newListName}
					placeholder="Enter List Name"
					onChange={(text) => setNewListName(text)}
				/>
				<Button
					onClick={() =>
					{
						let listNames = Object.keys(lists);
						if (listNames.find((item) => item === newListName) !== undefined)
							toast.error("A list with that name already exists!");
						else
						{
							let newLists = [...lists];
							newLists = [
								...lists,
								{
									name: newListName,
									createdAt: +new Date(),
									payload: [],
									uuid: newListName,
								},
							];
							dispatch(targetsActions.setLists(newLists));

							// Reset the input and close the new list bar
							setNewListName("");
							setOpenNewListBar(false);
						}
					}}
					sx={LOCAL_STYLES.iconButton}
				>
					<Icon color={Palette.white70} name="check" size={20} />
				</Button>
				<Button
					onClick={() => setOpenNewListBar(false)}
					sx={LOCAL_STYLES.iconButton}
				>
					<Icon color={Palette.white70} name="Close" size={20} />
				</Button>
			</Box>
		);
	else if (editName)
		return (
			<Box
				sx={[
					styles.row,
					{ alignItems: "center", gap: "5px", justifyContent: "space-between" },
				]}
			>
				<Typography sx={[LOCAL_STYLES.header]}>{s.targets.lists}</Typography>
				<InputField
					value={newListName}
					onChange={(text) => setNewListName(text)}
				/>
				<Button
					onClick={() =>
					{
						let newLists = [...lists];
						// Find the index of the list to be edited
						const existingIndex = newLists.findIndex(
							(list) => list.name === activeList,
						);

						if (existingIndex !== -1)
						{
							// If found, replace the name and update the timestamp
							newLists[existingIndex] = {
								...newLists[existingIndex],
								name: newListName,
								updatedAt: +new Date(),
							};

							dispatch(targetsActions.setLists(newLists));
						}
						setNewListName("");
						setEditName(false);
						setActiveList(newListName);
					}}
					sx={LOCAL_STYLES.iconButton}
				>
					<Icon color={Palette.white70} name="check" size={25} />
				</Button>
				<Button onClick={() => setEditName(false)} sx={LOCAL_STYLES.iconButton}>
					<Icon color={Palette.white70} name="close" size={25} />
				</Button>
			</Box>
		);
	// otherwise displays the default list selection bar
	else
		return (
			<Box
				sx={[
					styles.row,
					{ alignItems: "center", gap: "5px", justifyContent: "space-between" },
				]}
			>
				<Typography sx={[LOCAL_STYLES.header]}>
					<Typography component="span">{s.targets.lists}</Typography>
					<Button
						onClick={() =>
						{
							setDisplayList();
							dispatch(targetsActions.setActiveList(""));
							setActiveList("");
						}}
						sx={{ minWidth: "auto", padding: 0 }}
					>
						<Icon color={Palette.white50} name="Close" size={25} />
					</Button>
				</Typography>

				<Dropdown
					placeholder="Select Option"
					options={lists
						.filter((listName) => !listName?.deletedAt)
						.map((list) => ({
							label: list.name,
							value: list.name,
						}))}
					value={activeList}
					width="180px"
					onChange={(selectedList) =>
					{
						console.log("selectedList", selectedList);
						dispatch(targetsActions.setActiveList(selectedList.label));
						setActiveList(selectedList.label);
					}}
				/>

				<Button
					sx={LOCAL_STYLES.iconButton}
					onClick={() =>
					{
						setNewListName("");
						setOpenNewListBar(true);
					}}
				>
					<Icon name="add" sx={{ width: "30px", height: "30px" }} />
				</Button>

				<Button
					sx={LOCAL_STYLES.iconButton}
					onClick={() =>
					{
						setNewListName(activeList);
						setEditName(true);
					}}
					disabled={
						activeList === "Favorites" ||
						activeList === "My Searches" ||
						isEmpty(activeList)
					}
				>
					<Icon name="edit" color="white" />
				</Button>
				<Button
					sx={LOCAL_STYLES.iconButton}
					disabled={activeList === "Favorites" || isEmpty(activeList)}
					onClick={() =>
					{
						let array = [];
						let lists = [...listNames];
						lists.forEach((oneList, index) =>
						{
							if (oneList.name === activeList)
							{
								lists[index] = {
									...oneList,
									deletedAt: +new Date(),
								};
								array.push(lists[index]);
							}
							else array.push(oneList);
						});

						if (!isEmpty(array))
						{
							dispatch(targetsActions.setLists(array));
						}
						setActiveList("");
					}}
				>
					<Icon name="delete" style={{ width: "30px", height: "30px" }} />
				</Button>
			</Box>
		);
};

export default ListsBar;

const LOCAL_STYLES = {
	iconButton: {
		minWidth: "auto",
	},
	header: {
		color: Palette.white70,
		width: "60px",
		fontSize: "20px",
		display: "inline-flex",
		justifyContent: "space-between",
	},
};
