import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { get, isEmpty, isUndefined, debounce } from "lodash";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useState } from "react";
import { captureException } from "@sentry/browser";
import { useDispatch, useSelector } from "react-redux";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import DeleteIcon from "@mui/icons-material/Delete";
import ShareIcon from "@mui/icons-material/Share";
import IconButton from "@mui/material/IconButton";
import Download from "@mui/icons-material/Download";
import InfoIcon from "@mui/icons-material/Info";
import Image from "mui-image";
import CloseButton from "@components/CloseButton";
import s from "@common/shared/i18n/i18n";
import { planType } from "@indi/enums";
import { styles } from "../../shared/styles";
import { viewerActions } from "@redux/actions";
import { viewerConstants } from "@redux/constants";
import { Palette } from "@common/shared/common/styles";
import {
	selectImages,
	selectActiveSortBy,
	selectSocketsConnected,
	selectUser,
} from "@redux/selectors";
import InfoViewer from "./InfoViewer";
import AlertDialog from "@components/AlertDialog";
import Icon from "@components/Icon";
import CustomizedSwitch from "@components/CustomSwitch";
import ShareDialog from "./ShareDialog";
import ViewTopBar from "./ViewTopBar";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";
import TextField from '@mui/material/TextField';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import SortIcon from '@mui/icons-material/Sort';
import GridViewIcon from '@mui/icons-material/GridView';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import StellaFilterInputButton from "../../Components/StellaFilterInputButton";
import Dropdown from "../../Components/Dropdown";
import { useTheme } from '@mui/material/styles';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { PhotoLibrary } from '@mui/icons-material';
import { Link } from '@mui/material';

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

const limitBy = [
	{ label: s.cloud.gallery_drawer.all, value: 0 },
	{ label: s.cloud.gallery_drawer.h1, value: 60 * 60 * 1000 },
	{ label: s.cloud.gallery_drawer.h24, value: 24 * 60 * 60 * 1000 },
	{ label: s.cloud.gallery_drawer.d7, value: 7 * 24 * 60 * 60 * 1000 },
	{ label: s.cloud.gallery_drawer.m1, value: 30 * 24 * 60 * 60 * 1000 },
	{ label: s.cloud.gallery_drawer.y1, value: 365 * 24 * 60 * 60 * 1000 },
];

const deleteImagesFromCloud = async (user, uuids) =>
{
	if (!user) return;

	try
	{
		await axios.delete(
			`/api/cloud/images?username=${encodeURIComponent(user.username)}&token=${user.token}`,
			{ data: uuids },
		);
		// await axios.delete(
		// 	`/api/cloud/reset?username=${encodeURIComponent(user.username)}&token=${user.token}`,
		// );
	}
	catch (error)
	{
		console.error(error);
	}
};

const BadgeView = ({ bgColor, data = "N/A" }) => (
	<Box
		sx={[LOCAL_STYLES.badgeView, styles.center, { backgroundColor: bgColor }]}
	>
		<Typography sx={[styles.text, { fontSize: "12px" }]}>{data}</Typography>
	</Box>
);

const View = ({ active }) =>
{
	const dispatch = useDispatch();
	const images = useSelector(selectImages);
	const rules = useSelector((state) => state.viewer.dbrules);
	const cloudEnabled = useSelector((state) => state.options.ekosLiveCloud);
	const socketsConnected = useSelector(selectSocketsConnected);
	const user = useSelector(selectUser);
	const [showSortBar, setShowSortBar] = useState(false);
	const cloudImageUUID = useSelector((state) => state.ekos.cloudImageUUID);

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
	const { palette } = useTheme();

	const [state, setState] = useState({
		showFullImage: true,
		displayedImage: "",
		showInfo: false,
		showDialog: false,
		isLoading: true,
		type: "Recent Images",
	});
	const [foldersType, setFoldersType] = useState({
		label: "Recent",
		value: "Recent Images",
	});
	const [matchedImages, setMatchedImages] = useState([]);
	const [loadedVirtualFolders, setLoadedVirtualFolders] = useState([]);
	const [showImages, setShowImages] = useState(true);
	const [limit, setLimit] = useState(0);
	const sortBy = useSelector((state) =>
		selectActiveSortBy(state, { list: sortByList }),
	);
	const sortDirection = useSelector((state) => state.viewer.sortDirection);
	const [selectedFolder, setSelectedFolder] = useState("");
	const [isShareModalOpen, setIsShareModalOpen] = useState(false);
	const [viewType, setViewType] = useState('grid');
	const [selectedItems, setSelectedItems] = useState([]);
	const [searchQuery, setSearchQuery] = useState('');

	const deleteAll = async () =>
	{
		if (!isEmpty(matchedImages))
		{
			await deleteImagesFromCloud(
						user,
						matchedImages.map((image) => image.metadata.uuid),
			);
			setMatchedImages([]);
			generateVirtualFolders();
		}
	};

	const deleteImg = async () => {
		try {
			await deleteImagesFromCloud(user, [displayedImage.metadata.uuid]);
			
			setSelectedItems([]);
			setState(prev => ({
				...prev,
				showDialog: false,
				showInfo: false,
				showFullImage: false,
				displayedImage: null
			}));

			setMatchedImages(prev => 
				prev.filter(image => image.metadata.uuid !== displayedImage.metadata.uuid)
			);

			handleRefresh();
		} catch (error) {
			console.error(error);
			captureException(error);
		}
	};

	/**
	 * @param {string} tag - Tag to be added for image.
	 * @returns {void}
	 */
	const handleAddTag = (tag) =>
	{
		const uuid = get(displayedImage, "metadata.uuid", null);
		if (uuid) dispatch(viewerActions.addTag(uuid, tag));
	};

	/**
	 * Handles the deletion of a tag from the displayed image.
	 * @description This function retrieves the UUID of the displayed image and, if found,
	 * dispatches an action to remove the specified tag from the image.
	 * @param {string} tag - The tag to be deleted from the image.
	 * @returns {void}
	 */
	const handleDeleteTag = (tag) =>
	{
		const uuid = get(displayedImage, "metadata.uuid", null);
		if (uuid) dispatch(viewerActions.removeTag(uuid, tag));
	};

	/**
	 * Generates virtual folders based on the specified folder type and image metadata.
	 *
	 * @function generateVirtualFolders
	 * @description This function iterates through an array of images and extracts metadata
	 * based on the specified folder type (Target, Frame, Date, or Filter).
	 * It then generates an array of unique virtual folder names and sets
	 * the loaded virtual folders state. Finally, it fetches images for
	 * the generated virtual folders.
	 * @returns {void}
	 */
	const generateVirtualFolders = () =>
	{
		let generatedFolders = [];
		if (foldersType.label === "Target")
		{
			for (const oneImage of images)
			{
				// Make sure we have valid object metadata
				if (get(oneImage, "metadata.object", null) === null) continue;

				const imageTarget = oneImage["metadata"]["object"];
				if (cloudEnabled) generatedFolders.push(imageTarget);
				// else if (imageLocation.includes(sanitized) && !generatedFolders.includes(imageTarget))
				//     generatedFolders.push(imageTarget);
			}
		}
		else if (foldersType.label === "Frame")
		{
			for (const oneImage of images)
			{
				// Make sure we have valid object metadata
				if (get(oneImage, "metadata.frame", null) === null) continue;

				const frames = oneImage["metadata"]["frame"];

				if (cloudEnabled) generatedFolders.push(frames);
			}
		}
		else if (foldersType.label === "Date")
		{
			for (const oneImage of images)
			{
				// Make sure we have valid object metadata
				if (get(oneImage, "metadata.ts", null) === null) continue;

				let ts = oneImage["metadata"]["ts"];

				if (cloudEnabled)
				{
					let splitTs = ts.split("T");
					let date = splitTs[0].replace(/-/g, ".");
					generatedFolders.push(date);
				}
			}
		}
		else if (foldersType.label === "Filter")
		{
			for (const oneImage of images)
			{
				// Make sure we have valid object metadata
				if (get(oneImage, "metadata.filter", null) === null) continue;

				const filter = oneImage["metadata"]["filter"];
				if (!generatedFolders.includes(filter)) generatedFolders.push(filter);
			}
		}

		// Removes duplicated generated folder names
		generatedFolders = generatedFolders.filter((oneName, index) =>
		{
			return generatedFolders.indexOf(oneName) === index;
		});
		setLoadedVirtualFolders(generatedFolders);
		fetchImages(generatedFolders);
	};

	/**
	 * Fetches images based on the selected folder type.
	 * @param {[object]} files - An array of files. If empty, resets the matched images.
	 * @returns {void}
	 */
	const fetchImages = (files) =>
	{
		if (isEmpty(files)) setMatchedImages([]);
		let fetchedImages = [];
		if (foldersType.label === "All Image")
		{
			fetchedImages = images;
		}
		// If Recent option is selected, then fetch the recent images
		else if (foldersType.label === "Recent")
		{
			fetchedImages = getSortedImages("ts", 1, images).filter(
				(_, index) => index < 20,
			);
		}
		setMatchedImages(fetchedImages);
	};

	/**
	 * Sorts an array of images based on a specific metadata key and direction.
	 *
	 * @param {string} metadataKey - The key of the metadata to sort by(time, exp etc.).
	 * @param {number} sortDirection - The direction of the sort (0 for ascending, 1 for descending).
	 * @param {object[]} images - The array of images to sort.
	 * @returns {object[]} The sorted array of images.
	 */
	const getSortedImages = (metadataKey, sortDirection, images) =>
	{
		if (!isEmpty(images))
		{
			return images.sort((imageOne, imageTwo) =>
			{
				if (imageOne?.metadata[metadataKey] > imageTwo?.metadata[metadataKey])
					return sortDirection === 0 ? 1 : -1;
				if (imageOne?.metadata[metadataKey] < imageTwo?.metadata[metadataKey])
					return sortDirection === 0 ? -1 : 1;
				return 0;
			});
		}
		return [];
	};

	/**
	 * Returns a filtered array of images based on the provided limit and images array.
	 * @param {number} limit - The time limit in milliseconds to filter images by.
	 * @param {[object]} images - The array of image objects to filter.
	 * @returns {[object]} A filtered array of image objects.
	 */
	const getFilteredImages = (limit, images) =>
	{
		if (limit > 0 && !isEmpty(images))
		{
			const upUntil = Date.now() - limit;
			const UTCOffset = new Date().getTimezoneOffset() * 60;
			return (
				images?.filter((oneImage) =>
				{
					let getTs;
					if (cloudEnabled)
					{
						const date = new Date(oneImage.metadata.ts);
						getTs = date.getTime() / 1000;
					}
					else getTs = new Date(oneImage.metadata.ts).getTime();
					const ts = new Date(getTs - UTCOffset);
					return ts > upUntil;
				}) ?? []
			);
		}
		else return images;
	};

	/**
	 * Handles a change in the image limit and updates the gallery accordingly.
	 * @param {number} newLimit - The new limit for the number of images to display.
	 * @param {string} folder - The folder to retrieve images from.
	 * @async
	 * @throws {Error} If an error occurs while processing the image limit change.
	 */
	const limitChanged = async (newLimit, folder) =>
	{
		try
		{
			let directoryImages = [];
			if (foldersType.label === "All Image")
			{
				directoryImages = images;
			}
			else if (foldersType.label === "Recent")
			{
				directoryImages = getSortedImages("ts", 1, images).filter(
					(_, index) => index < 20,
				);
			}
			else
			{
				// All images from a specific folder
				directoryImages = extractImages(folder, true);
			}
			const newGallery = getSortedImages(
				sortBy,
				sortDirection,
				getFilteredImages(newLimit, directoryImages),
			);
			setLimit(newLimit);
			setMatchedImages(newGallery);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	/**
	 * Extract image files based on the folder selection and browsing type.
	 * @param {string} folderName - Name of the selected virtual folder.
	 * @param {boolean} timeLimit - Boolean to specify if the images should be returned.
	 * @returns {[object]|undefined} - Returns an array if timeLimit is true.
	 */
	const extractImages = (folderName, timeLimit) =>
	{
		let imagesArray = [];
		if (foldersType.label === "Target") {
			imagesArray = images.filter(oneImage => 
				oneImage["metadata"]["object"] === folderName
			);
		} else if (foldersType.label === "Frame") {
			imagesArray = images.filter(oneImage => 
				oneImage["metadata"]["frame"] === folderName
			);
		} else if (foldersType.label === "Date") {
			imagesArray = images.filter(oneImage => {
				const ts = oneImage["metadata"]["ts"];
				let dateString;
				if (cloudEnabled) {
					let splitTs = ts.split("T");
					dateString = splitTs[0].replace(/-/g, ".");
				} else {
					dateString = dayjs.unix(ts).format("YYYY.MM.DD");
				}
				return dateString === folderName;
			});
		} else if (foldersType.label === "Filter") {
			imagesArray = images.filter(oneImage => 
				oneImage["metadata"]["filter"] === folderName
			);
		}
		
		setMatchedImages(imagesArray);
		if (timeLimit) return imagesArray;
	};

	const handleRefresh = useCallback(() =>
	{
		if (!socketsConnected) return;
		dispatch(viewerActions.getImages(rules));
	}, [socketsConnected, rules]);

	const debouncedRefresh = useCallback(
		debounce(() => {
			if (!socketsConnected) return;
			dispatch(viewerActions.getImages(rules));
		}, 3000),
		[socketsConnected, rules]
	);

	const { displayedImage, showInfo, isLoading } = state;

	// Renders when Folder type is changed
	useEffect(() =>
	{
		setMatchedImages([]);
		generateVirtualFolders();
	}, [foldersType, images]); 

	// if sort direction, or sort by is changes, then images according to that
	useEffect(() =>
	{
		if (!isEmpty(matchedImages))
			setMatchedImages(
				getSortedImages(
					sortBy.value,
					sortDirection,
					getFilteredImages(limit, matchedImages),
				),
			);
	}, [sortBy, sortDirection]);

	//refresh images
	useEffect(() => {
		if (cloudImageUUID) {
			debouncedRefresh();
		}		
		// Cleanup function to cancel any pending debounced calls
		return () => {
			debouncedRefresh.cancel();
		};
	}, [cloudImageUUID]);

	useEffect(() =>
	{
		if (displayedImage)
		{
			setState({ ...state, isLoading: true });
		}
	}, [displayedImage]);

	const handleSelectItem = (uuid) => {
		setSelectedItems(prev => 
			prev.includes(uuid) 
				? prev.filter(id => id !== uuid)
				: [...prev, uuid]
		);
	};

	const handleSelectAll = () => {
		if (selectedItems.length === matchedImages.length) {
			setSelectedItems([]);
		} else {
			setSelectedItems(matchedImages.map(img => img.metadata.uuid));
		}
	};

	const handleSearch = (query) => {
		setSearchQuery(query);
		
		// If search is empty, restore original images based on folder type
		if (!query) {
			if (foldersType.label === "Recent" || foldersType.label === "All Image") {
				generateVirtualFolders();
			} else if (selectedFolder) {
				// If we're in a virtual folder, restore that folder's images
				extractImages(selectedFolder, true);
			} else {
				// If we're showing virtual folders, regenerate them
				generateVirtualFolders();
			}
			return;
		}

		// Handle search within current context
		if (foldersType.label === "Recent" || foldersType.label === "All Image") {
			// Search in all images for Recent/All Image views
			const filteredImages = matchedImages.filter(image => {
				const { metadata } = image;
				const searchableFields = [
					metadata.filename,
					metadata.object,
					metadata.filter,
					metadata.frame
				];
				
				return searchableFields.some(field => 
					field?.toLowerCase().includes(query.toLowerCase())
				);
			});
			setMatchedImages(filteredImages);
		} else if (showImages && selectedFolder) {
			// Search within the selected virtual folder
			const folderImages = extractImages(selectedFolder, true);
			const filteredImages = folderImages.filter(image => {
				const { metadata } = image;
				const searchableFields = [
					metadata.filename,
					metadata.object,
					metadata.filter,
					metadata.frame
				];
				
				return searchableFields.some(field => 
					field?.toLowerCase().includes(query.toLowerCase())
				);
			});
			setMatchedImages(filteredImages);
		} else {
			// Search in virtual folder names
			const filteredFolders = loadedVirtualFolders.filter(folder =>
				folder.toLowerCase().includes(query.toLowerCase())
			);
			setLoadedVirtualFolders(filteredFolders);
		}
	};

	const handleMultiDelete = async () => {
		if (selectedItems.length === 0) return;
		
		try {
			await deleteImagesFromCloud(
				user,
				selectedItems
			);
			
			setSelectedItems([]);
			setState(prev => ({ 
				...prev, 
				showDialog: false,
				displayedImage: selectedItems.includes(prev.displayedImage?.metadata?.uuid) 
					? null 
					: prev.displayedImage,
				showFullImage: !selectedItems.includes(prev.displayedImage?.metadata?.uuid)
			}));

			setMatchedImages(prevImages => 
				prevImages.filter(img => !selectedItems.includes(img.metadata.uuid))
			);

			handleRefresh();
		} catch (error) {
			console.error(error);
			captureException(error);
		}
	};

	const handleMultiDownload = () => {
		if (selectedItems.length === 0) return;
		
		const selectedImages = matchedImages.filter(img => 
			selectedItems.includes(img.metadata.uuid)
		);

		if (!selectedImages || !Array.isArray(selectedImages)) return;
		
		selectedImages.forEach(image => {
			const link = document.createElement('a');
			link.href = image.raw;
			link.download = image.metadata.filename || 'image';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		});

		setSelectedItems([]);
	};

	// Add useEffect to set initial displayedImage when matchedImages changes
	useEffect(() => {
		if (!isEmpty(matchedImages)) {
			setState(prev => ({
				...prev,
				displayedImage: matchedImages[0],
				showFullImage: true
			}));
		}
	}, [matchedImages]);

	const handleReset = () => {
		// Reset all state values to their initial values
		setShowSortBar(false);
		setSearchQuery('');
		setSelectedItems([]);
		setViewType('grid');
		setLimit(0);
		setFoldersType({
			label: "Recent",
			value: "Recent Images"
		});
		setShowImages(true);
		setSelectedFolder('');
		setState(prev => ({
			...prev,
			showFullImage: true,
			displayedImage: '',
			showInfo: false,
			showDialog: false,
			isLoading: true,
			type: "Recent Images"
		}));

		// Reset sort options through Redux
		dispatch(viewerActions.setOption(viewerConstants.SORT_DIRECTION, 1));
		dispatch(viewerActions.setOption(
			viewerConstants.SORT_FILTER,
			sortByList.findIndex(item => item.value === "ts")
		));

		// Refresh images
		handleRefresh();
	};

	// Add new useEffect for initial load
	useEffect(() => {
		if (active && socketsConnected) {
			dispatch(viewerActions.getImages(rules));
		}
	}, [active, socketsConnected, rules]);

	if (!active) return null;

	return (
		<Box sx={{ width: "100%", display: "flex", height: "calc(100vh - 88px)", position: "relative" }}>
			{selectedItems.length > 0 && (
				<Box 
					sx={{ 
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						zIndex: 1000,
						backgroundColor: '#fff',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '8px 16px',
						margin: '5px',
						borderRadius: '5px',
						backgroundColor: palette.grey[300],
						animation: 'slideDown 0.3s ease-out',
						'@keyframes slideDown': {
							'0%': {
								transform: 'translateY(-100%)',
								opacity: 0
							},
							'100%': {
								transform: 'translateY(0)',
								opacity: 1
							}
						}
					}}
				>
					<Typography color="black">{selectedItems.length} selected</Typography>
					<Box sx={{ display: 'flex', gap: 1 }}>
						<IconButton 
							size="small"
							onClick={() => {
								if (selectedItems.length === 1) {
									setIsShareModalOpen((prevState) => !prevState)
								}
							}}
							disabled={selectedItems.length > 1}
							sx={{
								transition: 'transform 0.2s ease',
								'&:hover': {
									transform: !isShareModalOpen && selectedItems.length === 1 ? 'scale(1.1)' : 'none'
								}
							}}
						>
							<ShareIcon sx={{ 
								color: selectedItems.length === 1 ? palette.primary.main : palette.grey[500]
							}} />
							{isShareModalOpen && (
								<ShareDialog shareURL={displayedImage.shortURL} />
							)}
						</IconButton>
						<IconButton 
							size="small"
							onClick={handleMultiDownload}
							disabled={selectedItems.length > 1}
							sx={{
								transition: 'transform 0.2s ease',
								'&:hover': {
									transform: selectedItems.length === 1 ? 'scale(1.1)' : 'none'
								}
							}}
						>
							<Download sx={{ 
								color: selectedItems.length === 1 ? palette.primary.main : palette.grey[500]
							}} />
						</IconButton>
						<IconButton 
							size="small"
							onClick={() => setState(prev => ({ ...prev, showDialog: true }))}
							sx={{
								transition: 'transform 0.2s ease',
								'&:hover': {
									transform: 'scale(1.1)'
								}
							}}
						>
							<DeleteIcon sx={{ color: 'red' }} />
						</IconButton>
					</Box>
				</Box>
			)}

			<Box sx={{ width: "20vw", height: "100%", backgroundColor: "#222222", display: 'flex', flexDirection: 'column' }}>
				<Box sx={{ position: 'sticky', top: 0, backgroundColor: "#222222", padding: "16px", zIndex: 1 }}>
					<Box sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 2,
						mb: 2
					}}>
						<TextField
							sx={{ flex: 1 }}
							size="small"
							placeholder="Search images..."
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							InputProps={{
								startAdornment: <SearchIcon sx={{ color: '#666', mr: 1 }} />,
								endAdornment: (
									<StellaFilterInputButton
										setMatchedImages={setMatchedImages}
										mode="view"
									/>
								),
								sx: {
									backgroundColor: '#333',
									color: '#fff',
									'& .MuiOutlinedInput-notchedOutline': {
										borderColor: '#444',
									},
								},
							}}
						/>
						<IconButton
							onClick={handleReset}
							sx={{
								backgroundColor: '#333',
								border: '1px solid #444',
								borderRadius: '4px',
								padding: '8px',
								'&:hover': {
									backgroundColor: '#3a3a3a',
								},
								transition: 'transform 0.2s ease',
								'&:active': {
									transform: 'scale(0.95)',
								},
							}}
							title="Reset all filters"
						>
							<RestartAltIcon sx={{ 
								color: '#fff',
								fontSize: '20px'
							}} />
						</IconButton>
					</Box>

					<Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
						<IconButton
							size="small"
							onClick={() => setShowSortBar((prevState) => !prevState)}
							sx={{
								backgroundColor: showSortBar ? palette.primary.main : '#333',
								border: '1px solid #444',
								borderRadius: '4px',
								padding: '4px',
								height: '32px',
								width: '32px',
								'&:hover': {
									backgroundColor: showSortBar ? palette.primary.dark : '#3a3a3a',
								},
							}}
						>
							<SortIcon sx={{ color: showSortBar ? '#fff' : '#666' }} />
						</IconButton>

						<Box sx={{ 
							display: 'flex', 
							alignItems: 'center',
							px: 2,
							gap: 1
						}}>
							<SearchIcon sx={{ color: '#666', fontSize: '20px' }} />
							<Typography sx={{ 
								color: '#666',
								fontSize: '14px',
								fontWeight: 500
							}}>
								{matchedImages?.length || 0}
							</Typography>
						</Box>

						<ToggleButtonGroup
							value={viewType}
							exclusive
							onChange={(e, newValue) => {
								if (newValue) {
									setViewType(newValue);
									setSelectedItems([]);
								}
							}}
							size="small"
							sx={{
								ml: 'auto',
								'& .MuiToggleButton-root': {
									border: '1px solid #444',
									borderRadius: '4px',
									padding: '4px 12px',
									color: '#fff',
									backgroundColor: '#333',
									'&:first-of-type': {
										borderTopRightRadius: 0,
										borderBottomRightRadius: 0,
									},
									'&:last-of-type': {
										borderTopLeftRadius: 0,
										borderBottomLeftRadius: 0,
										borderLeft: 'none',
									},
									'&.Mui-selected': {
										backgroundColor: '#444',
										color: '#fff',
									},
									'&:hover': {
										backgroundColor: '#3a3a3a',
									},
								},
							}}
						>
							<ToggleButton value="grid">
								<GridViewIcon sx={{ fontSize: '20px' }} />
							</ToggleButton>
							<ToggleButton value="list">
								<ViewListIcon sx={{ fontSize: '20px' }} />
							</ToggleButton>
						</ToggleButtonGroup>
					</Box>

					<Box sx={{ mt: 2 }}>
						{showSortBar && (
							<Box sx={[LOCAL_STYLES.sortBar]}>
								<Box sx={{ flexGrow: 1 }}>
									<Dropdown
										options={sortByList}
										value={sortBy.label}
										onChange={sortByChanged}
										width="100%"
									/>
								</Box>
								<Box sx={[styles.center, { flexDirection: "row", gap: "10px" }]}>
									<Box sx={[styles.center, { flexDirection: "row" }]}>
										<IconButton
											onClick={() => sortDirectionChanged(sortDirection === 1 ? 0 : 1)}
											sx={{
												backgroundColor: '#333',
												border: '1px solid #444',
												borderRadius: '4px',
												padding: '4px',
												'&:hover': {
													backgroundColor: '#3a3a3a',
												},
											}}
										>
											{sortDirection === 0 ? (
												<ArrowUpwardIcon sx={{ color: '#fff' }} />
											) : (
												<ArrowDownwardIcon sx={{ color: '#fff' }} />
											)}
										</IconButton>
									</Box>
								</Box>
							</Box>
						)}
					</Box>

					<Box sx={{ mt: 2 }}>
						<Dropdown
							options={options}
							value={foldersType.label}
							onChange={(data) =>
							{
								setFoldersType(data);
								(data.label !== "All Image" && data.label !== "Recent") && setShowImages(false);
							}}
							width="100%"
						/>
					</Box>
				</Box>

				<Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
					<Box sx={{ mb: 2, px: 2, py: 1, borderBottom: '1px solid #444' }}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1,
								cursor: matchedImages.length > 0 ? 'pointer' : 'not-allowed',
							}}
							onClick={matchedImages.length > 0 ? handleSelectAll : undefined}
						>
							<Checkbox
								checked={matchedImages.length > 0 && selectedItems.length === matchedImages.length}
								indeterminate={selectedItems.length > 0 && selectedItems.length < matchedImages.length}
								disabled={matchedImages.length === 0}
								sx={{
									color: '#666',
									'&.Mui-checked': {
										color: '#fff',
									},
								}}
							/>
							<Typography sx={{ color: matchedImages.length > 0 ? '#fff' : '#666' }}>Select All</Typography>
						</Box>
					</Box>

					{matchedImages.length === 0 && (
						<Box sx={{ padding: "16px", display: "flex", justifyContent: "center", alignItems: "center" }}>
							<Typography sx={{ color: "#fff" }}>{s.cloud.no_images_title}</Typography>
						</Box>
					)}

					{matchedImages.map((item) => {
						if (item.isGroupHeader) {
							return (
								<Box 
									key={`group-${item.groupName}`}
									sx={{
										padding: '12px 16px',
										backgroundColor: '#333',
										borderBottom: '1px solid #444',
									}}
								>
									<Typography sx={{ color: '#fff', fontWeight: 500 }}>
										{item.groupName}
									</Typography>
								</Box>
							);
						}

						const {
							metadata: { uuid, filename },
						} = item;
						
						return viewType === 'grid' ? (
							<Box
								sx={{
									display: 'inline-block',
									width: '50%',
									padding: '4px',
									boxSizing: 'border-box',
								}}
								key={uuid}
							>
								<Box
									sx={{
										position: "relative",
										border: item.thumbnail === displayedImage?.thumbnail
											? "2px solid red"
											: "none",
									}}
								>
									<Box
										sx={{
											position: "absolute",
											top: 4,
											left: 4,
											zIndex: 1,
										}}
										onClick={(e) => {
											e.stopPropagation();
										}}
									>
										<Checkbox
											checked={selectedItems.includes(uuid)}
											onChange={(e) => {
												e.stopPropagation();
												handleSelectItem(uuid);
											}}
											sx={{
												color: '#fff',
												borderRadius: '4px',
												boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
												'&.Mui-checked': {
													color: '#fff',
												},
												'&:hover': {
													boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
												},
											}}
										/>
									</Box>

									<Image
										duration={0}
										onClick={() => setState({ ...state, displayedImage: item })}
										style={{
											width: "100%",
											aspectRatio: "1",
											cursor: "pointer",
											objectFit: "cover",
										}}
										src={item.thumbnail}
									/>

									<Box
										sx={{
											position: "absolute",
											bottom: 0,
											left: 0,
											right: 0,
											backgroundColor: "#d5cdcd17",
											padding: '4px',
										}}
									>
										<Typography 
											sx={{ 
												color: "#fff",
												fontSize: "12px",
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												whiteSpace: 'nowrap',
											}}
										>
											{filename}
										</Typography>
									</Box>
								</Box>
							</Box>
						) : (
							<Box
								key={uuid}
								sx={{
									padding: "8px",
									cursor: "pointer",
									backgroundColor: item.thumbnail === displayedImage.thumbnail ? '#333' : 'transparent',
									'&:hover': {
										backgroundColor: '#2a2a2a',
									},
									display: 'flex',
									alignItems: 'center',
									gap: 1,
								}}
								onClick={() => setState({ ...state, displayedImage: item })}
							>
								<Checkbox
									checked={selectedItems.includes(uuid)}
									onChange={(e) => {
										e.stopPropagation();
											handleSelectItem(uuid);
									}}
									sx={{
										color: '#666',
										'&.Mui-checked': {
											color: '#fff',
										},
									}}
								/>
								<Box
									onClick={() => setState({ ...state, displayedImage: item })}
									sx={{ flex: 1 }}
								>
									<Typography 
										sx={{ 
											color: "#fff",
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											whiteSpace: 'nowrap',
										}}
									>
										{filename}
									</Typography>
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>

			{showImages !== true &&
				!isEmpty(loadedVirtualFolders) &&
				loadedVirtualFolders.map((folder) =>
				{
					return (
						<Box sx={{ padding: "10px", zIndex: 1000 }} key={folder}>
							<Button
								onClick={async () =>
								{
									setSelectedFolder(folder);
									setShowImages(true);
									await limitChanged(limit, folder);
								}}
							>
								<Icon name="folder" color={Palette.white} />
								<Typography sx={[styles.text, { paddingLeft: "8px" }]}>
									{folder}
								</Typography>
							</Button>
						</Box>
					);
				})}
			
			{
				showImages && 
				<Box sx={{ flex: 1, position: "relative" }}>
					<Box
						sx={{
							zIndex: 20,
							position: "absolute",
							display: "flex",
							flexDirection: "column",
							right: "1%",
							top: "20px",
							gap: "18px",
							boxSizing: "border-box",
						}}
					>
						{/* <Box
							sx={{
								cursor: "pointer",
								position: "relative",
								width: "38px",
								height: "38px",
							}}
						>
							<CloseButton
								right={0}
								top={0}
								onChange={() =>
								{
									setState((prevState) => ({
										...prevState,
										showFullImage: false,
									}));
									setIsShareModalOpen(false);
								}}
								sx={{ width: "38px", height: "38px" }}
							/>
						</Box> */}
						{/* <a
							href={displayedImage.raw}
							style={{
								cursor: "pointer",
								display: "grid",
								placeItems: "center",
								width: "38px",
								height: "38px",
								background: Palette.blue,
								borderRadius: "4px",
							}}
							target="_blank"
							rel="noreferrer noopener"
						>
							<Download sx={{ fill: Palette.white }} />
						</a>

						<Box sx={{ position: "relative" }}>
							<IconButton
								sx={{
									background: Palette.blue,
									borderRadius: "4px",
									color: Palette.white,
									width: "38px",
									height: "38px",
									":hover": { background: Palette.blue },
								}}
								onClick={() => setIsShareModalOpen((prevState) => !prevState)}
							>
								<ShareIcon />
							</IconButton>
							
						</Box>

						<IconButton
							sx={{
								background: Palette.red,
								borderRadius: "4px",
								color: Palette.white,
								":hover": { background: Palette.red },
								width: "38px",
								height: "38px",
							}}
							onClick={() =>
								setState((prevState) => ({ ...prevState, showDialog: true }))
							}
						>
							<DeleteIcon />
						</IconButton> */}
					</Box>

					{showInfo && (
						<Box
							sx={{
								position: "absolute",
								top: "calc(6% + 16px)",
								left: "0",
								zIndex: 10,
								backgroundColor: "#000000aa",
							}}
						>
							<InfoViewer
								data={displayedImage}
								onTagAdd={handleAddTag}
								onTagRemove={handleDeleteTag}
							/>
						</Box>
					)}

					{!displayedImage ? (
						<Box 
							sx={{ 
								height: 'calc(100vh - 150px)',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 2,
								color: '#666'
							}}
						>
							<PhotoLibrary sx={{ fontSize: 48, color: '#666' }} />
							<Box sx={{ textAlign: 'center' }}>
								<Typography variant="h6" sx={{ mb: 1 }}>
									{s.cloud.no_images_title}
								</Typography>
								<Typography variant="body1">
									{s.cloud.enable_cloud}
								</Typography>
							</Box>
						</Box>
					) : (
						<>
							<Box sx={[styles.center, { marginTop: "12px" }]}>
								<Typography sx={styles.text}>
									{displayedImage["metadata"]?.filename}
								</Typography>
							</Box>

							<Box
								sx={[
									styles.center,
									{
										justifyContent: "flex-start",
										width: "100%",
										overflow: "hidden",
										boxSizing: "border-box",
										padding: "16px",
									},
								]}
							>
								{isLoading && (
									<Box
										sx={[
											styles.center,
											{
												position: "absolute",
												left: 0,
												top: 0,
												right: 0,
												bottom: 0,
												zIndex: 0,
												border: "1px solid red",
											},
										]}
									>
										<CircularProgress sx={{ color: Palette.orange }} />
									</Box>
								)}
								<TransformWrapper
									minScale={0.3}
									initialPositionX={20}
									initialPositionY={0}
									sx={{ maxWidth: "100%", overflow: "hidden" }}
								>
									<TransformComponent
										wrapperStyle={{
											width: "100%",
											height: "calc(100vh - 150px)",
											boxSizing: "border-box",
										}}
										contentStyle={{ width: "100%" }}
									>
										<Image
											onError={() => setState({ ...state, isLoading: false })}
											onLoad={() => setState({ ...state, isLoading: false })}
											duration={0}
											src={displayedImage.src}
											sx={{
												cursor: "pointer",
												maxWidth: "100%",
												height: "auto",
											}}
										/>
									</TransformComponent>
								</TransformWrapper>
							</Box>

							<IconButton
								sx={{
									backgroundColor: showInfo ? Palette.orange : "",
									border: "1px solid grey",
									"&:hover": { backgroundColor: showInfo ? Palette.orange : "" },
									position: "absolute",
									top: "calc(1% + 16px)",
									left: "calc(1% + 16px)",
									borderRadius: "50%",
									padding: "4px",
								}}
								onClick={() => setState({ ...state, showInfo: !showInfo })}
							>
								<InfoIcon sx={{ color: Palette.white, fontSize: 20 }} />
							</IconButton>
						</>
					)}
				</Box>
			}


			<AlertDialog
				handleDelete={selectedItems.length > 1 ? handleMultiDelete : deleteImg}
				show={state.showDialog}
				close={() => setState({ ...state, showDialog: false })}
				title="Confirmation"
				description={
					selectedItems.length > 1 
						? `Are you sure you want to delete ${selectedItems.length} selected images?`
						: "Are you sure you want to delete the displayed Image?"
				}
			/>
		</Box>
	);

	// return (
	// 	<Box sx={{ width: "90%" }}>
	// 		<ViewTopBar
	// 			foldersType={foldersType}
	// 			setFoldersType={setFoldersType}
	// 			setMatchedImages={setMatchedImages}
	// 			setShowImages={setShowImages}
	// 			refresh={handleRefresh}
	// 			deleteAll={deleteAll}
	// 			imageQuantity={matchedImages.length}
	// 		/>
	// 		{user && user.plan_id === planType.DEFAULT && <CurrentPlanInformer />}
	// 		<Grid
	// 			container
	// 			sx={[
	// 				styles.row,
	// 				{
	// 					overflowY: "scroll",
	// 					height: "75vh",
	// 					marginTop: "20px",
	// 					justifyContent: "center",
	// 					"::-webkit-scrollbar": {
	// 						height: "4px",
	// 					},
	// 					"::-webkit-scrollbar-track": {
	// 						WebkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
	// 					},
	// 					"::-webkit-scrollbar-thumb": {
	// 						backgroundColor: "rgba(0,0,0,.1)",
	// 						outline: `1px solid ${Palette.grey44}`,
	// 					},
	// 				},
	// 			]}
	// 		>
	// 			{showImages !== true &&
	// 				!isEmpty(loadedVirtualFolders) &&
	// 				loadedVirtualFolders.map((folder) =>
	// 				{
	// 					return (
	// 						<Box sx={{ padding: "10px" }} key={folder}>
	// 							<Button
	// 								onClick={async () =>
	// 								{
	// 									setSelectedFolder(folder);
	// 									setShowImages(true);
	// 									await limitChanged(limit, folder);
	// 								}}
	// 							>
	// 								<Icon name="folder" color={Palette.white} />
	// 								<Typography sx={[styles.text, { paddingLeft: "8px" }]}>
	// 									{folder}
	// 								</Typography>
	// 							</Button>
	// 						</Box>
	// 					);
	// 				})}
	// 			{!isEmpty(matchedImages) &&
	// 				matchedImages.map((oneImage) =>
	// 				{
	// 					const {
	// 						thumbnail,
	// 						metadata: { filter, exptime, xbinning, ybinning, uuid },
	// 					} = oneImage;
	// 					if (isEmpty(uuid)) return null;
	// 					return (
	// 						<Grid sx={[{ padding: "20px", maxHeight: "200px" }]} key={uuid}>
	// 							<Image
	// 								duration={0}
	// 								onClick={() =>
	// 									setState({
	// 										...state,
	// 										displayedImage: oneImage,
	// 										showFullImage: true,
	// 									})
	// 								}
	// 								style={{ width: "150px", height: "120px", cursor: "pointer" }}
	// 								src={thumbnail}
	// 								loading="lazy"
	// 							/>
	// 							<Box sx={[styles.row, LOCAL_STYLES.badgeMainView]}>
	// 								{!isEmpty(filter) && (
	// 									<BadgeView
	// 										data={
	// 											filter.length > 3
	// 												? filter.toUpperCase().substring(0, 3)
	// 												: filter.toUpperCase()
	// 										}
	// 										bgColor={Palette.red}
	// 									/>
	// 								)}
	// 								{!isUndefined(exptime) && (
	// 									<BadgeView
	// 										data={exptime?.toFixed(1)}
	// 										bgColor={Palette.orange}
	// 									/>
	// 								)}
	// 								{!isUndefined(xbinning) && !isUndefined(ybinning) && (
	// 									<BadgeView
	// 										data={`${xbinning}x${ybinning}`}
	// 										bgColor={Palette.grey44}
	// 									/>
	// 								)}
	// 							</Box>
	// 						</Grid>
	// 					);
	// 				})}
	// 		</Grid>
	// 		{(foldersType.label === "Recent" ||
	// 			foldersType.label === "All Image" ||
	// 			showImages) && (
	// 			<Box sx={{ display: "grid", placeItems: "center", marginTop: "40px", zIndex: 1000 }}>
	// 				<CustomizedSwitch
	// 					width="375px"
	// 					options={limitBy}
	// 					value={limit}
	// 					onChange={async (value) =>
	// 					{
	// 						await limitChanged(value, selectedFolder);
	// 					}}
	// 				/>
	// 			</Box>
	// 		)}
	// 	</Box>
	// );
};

const LOCAL_STYLES = {
	badgeView: {
		borderRadius: "25px",
		width: "35px",
		height: "25px",
	},
	badgeMainView: {
		flexDirection: "row",
		marginTop: "5px",
		justifyContent: "space-evenly",
		width: "150px",
	},
	sortBar: {
		display: "flex",
		gap: "20px",
		borderBottomWidth: 1,
		borderBottomColor: Palette.grey44,
		backgroundColor: Palette.grey22,
		justifyContent: "space-between",
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

export default View;
