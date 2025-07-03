import React, { memo, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { get, isEmpty, isEqual } from "lodash";
import {
	Box,
	Button,
	IconButton,
	Input,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import FolderIcon from "@mui/icons-material/Folder";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import { ekosFileManager, Severity } from "@indi/enums";
import commands from "@commands";
import { selectConnected } from "@redux/selectors";
import { ekosActions } from "@redux/actions";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import { styles } from "@client/shared/styles";
import CloseButton from "@components/CloseButton";
import { captureException } from "@sentry/browser";

const Local = (props) =>
{
	const dispatch = useDispatch();
	const { dir, fileExtension, isFile, selection, show, toggle, onConfirm } =
		props;

	const connected = useSelector(selectConnected);
	const list = useSelector(
		(state) => get(state.ekos.files, "list", []),
		isEqual,
	);

	const [state, setState] = useState({
		selectedFolder: "",
		isNewDir: false,
		newDir: "",
	});
	const [loadedFolderNames, setLoadedFolderNames] = useState([]);
	const [filteredArray, setFilteredArray] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [activeDirectory, setActiveDirectory] = useState([]);
	const [browsingDirectory, setBrowsingDirectory] = useState(dir);
	const [sortAscending, setSortAscending] = useState(true);

	const truncateFilename = (filename, maxLength = 15) =>
	{
		if (filename.length <= maxLength) return filename;
		const extension = filename.split(".").pop();
		return `${filename.slice(0, maxLength)}...${extension}`;
	};

	// Function to handle the search input change
	const handleSearchChange = (event) =>
	{
		setSearchQuery(event.target.value);
	};

	// Function to toggle sorting order
	const toggleSortOrder = () =>
	{
		setSortAscending((prev) => !prev);
	};

	const getDirectoryFolderNames = (directory) =>
	{
		try
		{
			dispatch(
				ekosActions.fileDirectoryOperation({
					path: directory,
					operation: ekosFileManager.LIST,
				}),
			);

			if (!isEmpty(list))
			{
				const payload = get(list, "payload", []);
				if (!isEmpty(payload))
				{
					let array = [];
					for (const oneDir of payload)
					{
						if (
							oneDir.name !== "." &&
							oneDir.name !== ".." &&
							!isEmpty(oneDir.name)
						)
						{
							if (oneDir.isFile)
							{
								if (oneDir.name.includes(fileExtension))
									array.push({ name: oneDir.name, isFile: oneDir.isFile });
							}
							else array.push({ name: oneDir.name, isFile: oneDir.isFile });
						}
					}
					setLoadedFolderNames(array);
					setFilteredArray(array);
				}
			}
		}
		catch (err)
		{
			console.log(err);
			const ts = dayjs().format("YYYY-MM-DD-hh-mm-ss");
			dispatch({
				type: commands.NEW_NOTIFICATION,
				payload: {
					severity: Severity.WARNING,
					uuid: ts,
					message: s.ekos.scheduler.err_loading_folders,
				},
			});
		}
	};

	// Function to filter and sort the folders based on search query and sort order
	const filterAndSortFolders = (isAscending) =>
	{
		// Filter the array based on the search query
		const filtered = loadedFolderNames.filter((folder) =>
			folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		// Sort the filtered folders based on the sortAscending value
		const sorted = [...filtered].sort((a, b) =>
		{
			if (isAscending)
			{
				return a.name.localeCompare(b.name); // Ascending order
			}
			else
			{
				return b.name.localeCompare(a.name); // Descending order
			}
		});

		return sorted;
	};

	// Initializes the browsing directory to home dir
	// gets home directory folders and files

	const setup = (homeDir) =>
	{
		setBrowsingDirectory(homeDir);
		getDirectoryFolderNames(homeDir);
	};

	//Set active directory
	useEffect(() =>
	{
		if (!isEmpty(browsingDirectory))
			setActiveDirectory(browsingDirectory.split("/"));
	}, []);

	// Update filteredArray whenever searchQuery or sortAscending changes
	useEffect(() =>
	{
		const sortedFilteredArray = filterAndSortFolders(sortAscending);
		setFilteredArray(sortedFilteredArray);
	}, [searchQuery, sortAscending]);

	useEffect(() =>
	{
		if (!isEmpty(browsingDirectory) && connected)
		{
			getDirectoryFolderNames(browsingDirectory);
		}
	}, [browsingDirectory, show, list]);

	// updates folders and files when file type changes
	useEffect(() =>
	{
		if (connected)
		{
			try
			{
				setup(dir);
			}
			catch (error)
			{
				captureException(error);
			}
		}
	}, [fileExtension, dir, isNewDir, connected]);

	const { isNewDir, newDir } = state;

	return (
		<Box>
			{show && isNewDir === false ? (
				<Box>
					<CloseButton onChange={toggle} top={10} right={10} />

					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
						}}
					>
						<Box style={styles.row}>
							<IconButton
								disabled={activeDirectory.length <= 3}
								onClick={() =>
									{
									let directory = browsingDirectory.split("/");
									directory.pop();
									setActiveDirectory(directory);
									const makePath = directory.join("/");
									setBrowsingDirectory(makePath);
								}}
								sx={[{ backgroundColor: "#FFFCFA1F", marginRight: "15px" }]}
							>
								<ArrowBackIcon
									sx={{ color: Palette.white, fontSize: "25px" }}
								/>
							</IconButton>

							{isFile && (
								<IconButton
									sx={[
										LOCAL_STYLES.navButton,
										{ backgroundColor: Palette.blue },
									]}
									onClick={async () =>
										{
										setState({ ...state, isNewDir: true });
									}}
								>
									<CreateNewFolderIcon
										sx={{ color: Palette.white, fontSize: "25px" }}
									/>
								</IconButton>
							)}

							<TextField
								sx={{ marginLeft: "15px", height: "45px" }}
								placeholder="Search.."
								onChange={handleSearchChange}
							/>
						</Box>
						<Box>
							<IconButton onClick={() => toggleSortOrder(!sortAscending)}>
								<SwapVertIcon sx={{ color: Palette.white, fontSize: "25px" }} />
							</IconButton>
						</Box>
					</Box>

					{/* The folder items */}

					{isEmpty(loadedFolderNames) ? (
						<Box sx={{ padding: "15px" }}>
							<Typography sx={{ color: "white" }}>
								{s.general.empty_folder}
							</Typography>
						</Box>
					) : (
						<Box
							sx={[
								LOCAL_STYLES.listBox,
								{
									gridTemplateColumns:
										loadedFolderNames.length > 5
											? "repeat(5, 1fr)"
											: `repeat(${loadedFolderNames.length}, 1fr)`,
								},
							]}
						>
							{filteredArray.map((folder, index) => (
								<Tooltip title={folder.name} key={index}>
									<Button
										sx={LOCAL_STYLES.folderView}
										onClick={() =>
											{
											if (get(folder, "isFile", false))
												{
												const path = browsingDirectory + "/" + folder.name;
												selection(path);
												toggle();
											}
											else
												{
												const array = [...activeDirectory];
												array.push(folder.name);
												setActiveDirectory(array);
												const path = browsingDirectory + "/" + array.at(-1);
												setBrowsingDirectory(path);
											}
										}}
									>
										{get(folder, "isFile", false) ? (
											<FileOpenIcon
												sx={{ color: Palette.orange, fontSize: "25px" }}
											/>
										) : (
											<FolderIcon
												sx={{ color: Palette.blue, fontSize: "25px" }}
											/>
										)}
										<Typography sx={LOCAL_STYLES.folderItem}>
											{truncateFilename(folder.name)}
										</Typography>
									</Button>
								</Tooltip>
							))}
						</Box>
					)}

					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							gap: "8px",
						}}
					>
						<Typography sx={{ color: "#CECECE" }}>
							{s.general.selected_dir}:{" "}
							<span style={{ color: Palette.orange, fontWeight: 500 }}>
								{browsingDirectory}
							</span>
						</Typography>
						{!isFile && (
							<Button
								onClick={() =>
									{
									toggle();
									onConfirm && onConfirm(browsingDirectory);
								}}
							>
								{s.general.confirm}
							</Button>
						)}
					</Box>
				</Box>
			) : (
				<Box sx={[LOCAL_STYLES.newDirModal, { maxWidth: 400 }]}>
					<Typography sx={{ color: "white", gridColumn: "span 2" }}>
						{s.general.create_new_folder}: {browsingDirectory}
					</Typography>
					<Input
						value={newDir}
						onChange={(evt) => setState({ ...state, newDir: evt.target.value })}
						sx={{
							gridColumn: "span 2",
							backgroundColor: "#FFFFFF1A",
							color: "white",
							borderRadius: "4px",
							padding: "4px 12px",
						}}
						placeholder={s.general.new_folder}
						disableUnderline
					/>
					<Button
						onClick={async () =>
							{
							try
								{
								dispatch(
									ekosActions.fileDirectoryOperation({
										path: browsingDirectory + newDir,
										operation: ekosFileManager.CREATE,
									}),
								);
								setState({ ...state, isNewDir: false, newDir: "" });
							}
							catch (error)
								{
								console.log("error in create directory: ", error);
							}
						}}
						sx={[LOCAL_STYLES.newDirButton]}
					>
						{s.general.ok}
					</Button>
					<Button
						onClick={() => setState({ ...state, isNewDir: false })}
						sx={[LOCAL_STYLES.newDirButton]}
					>
						{s.general.cancel}
					</Button>
				</Box>
			)}
		</Box>
	);
};

const LOCAL_STYLES = {
	folderView: {
		flexDirection: "row",
		alignItems: "center",
		gap: "4px",
		color: "white",
		justifyContent: "space-around",
		backgroundColor: "#FFFCFA1F",
		display: "flex",
		flexWrap: "wrap",
		gap: "10px",
		maxWidth: "100%",
		padding: "10px",
		backgroundColor: "#2c2c2c",
		borderRadius: "5px",
		overflow: "hidden",
	},
	folderItem: {
		color: "white",
		fontSize: "15px",
		position: "relative",
		backgroundColor: "#444",
		padding: "5px 10px",
		borderRadius: "3px",
		maxWidth: "150px",
		width: "150px",
		textAlign: "center",
		overflow: "hidden",
		whiteSpace: "nowrap",
		textOverflow: "ellipsis",
		cursor: "pointer",
	},
	deleteButton: {
		height: "40px",
		width: "40px",
		backgroundColor: "transparent",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 0,
	},
	navButton: {
		width: "40px",
		height: "40px",
		minWidth: "auto",
		padding: 0,
		borderRadius: "4px",
	},
	newDirModal: {
		display: "grid",
		alignItems: "center",
		rowGap: "16px",
		columnGap: "8px",
		gridTemplateColumn: "repeat(2, 1fr)",
		backgroundColor: "#1D1D1D",
		borderRadius: "5px",
		border: "2px solid #000",
		padding: "40px 10px",
	},
	newDirButton: {
		color: "white",
		backgroundColor: "#FFFFFF1A",
		textAlign: "center",
	},
	viewTitle: {
		textAlign: "center",
		color: Palette.orange,
		fontWeight: "bold",
		margin: "0 auto",
	},
	listBox: {
		display: "grid",
		gap: "4px",
		alignItems: "center",
		padding: "15px",
	},
};

export default memo(Local);
