import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { 
	Box, 
	Modal, 
	Typography, 
	Button, 
	Paper, 
	Divider, 
	Chip,
	Tooltip,
	IconButton,
	useTheme,
	Fade,
	alpha
} from "@mui/material";
import { Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { styles } from "../shared/styles";
import ObservatoryAddressBox from "./ObservatoryAddressBox";
import { LOCATION_ACCURACY } from "@client/helpers/common";
import PlacesAutoComplete from "./PlacesAutoComplete";
import MapCircle from "./MapCircle";
import useActiveUser from "@hooks/useActiveUser";
import CloseButton from "./CloseButton";
import useThrottle from "@hooks/useThrottle";

// Import additional icons
import MyLocationIcon from '@mui/icons-material/MyLocation';
import PlaceIcon from '@mui/icons-material/Place';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import { Palette } from "@common/shared/common/styles";

const defaultLocationData = {
	country: "USA",
	region: "Rapid City",
	accuracy: LOCATION_ACCURACY.COARSE,
};

const Map = ({
	confirmPosition,
	open,
	setPublicLocation,
	isPublicLocation,
	defaultPosition = null,
	initialLocationData = defaultLocationData,
	setBortleScale,
}) =>
{
	const user = useActiveUser();
	const [zoom, setZoom] = useState(6);
	const [additionalLocationInformation, setAdditionalLocationInformation] =
		useState(initialLocationData ?? defaultLocationData);
	const [center, setCenter] = useState(
		defaultPosition ?? { lat: 53.54992, lng: 10.00678 },
	);
	const [selectedPosition, setSelectedPosition] = useState();
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() =>
	{
		if (defaultPosition)
		{
			setCenter(defaultPosition);
			setSelectedPosition(defaultPosition);
			return;
		}
		
		setIsLoading(true);
		navigator.geolocation.getCurrentPosition(
			(position) =>
			{
				const coordinates = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setCenter(coordinates);
				setSelectedPosition(coordinates);
				setIsLoading(false);
			},
			(err) =>
			{
				console.log(err);
				setIsLoading(false);
			},
		);

		return () =>
		{
			confirmPosition?.(selectedPosition);
		};
	}, []);

	const updateBortleScale = useThrottle(async ({ lat, lng }) =>
	{
		if (!user) return null;
		
		try
		{
			const { data } = await axios.get(`/api/weather/bortle-sky`, {
				params: {
					username: user.username,
					token: user.token,
					latitude: lat,
					longitude: lng,
				},
			});
			if (!data) return;
			setBortleScale?.(data);
		}
		catch (error)
		{
			captureException(error);
		}
	}, 1000);

	const onSubmit = useCallback(() =>
	{
		confirmPosition({
			...additionalLocationInformation,
			...(selectedPosition ?? {}),
		});
		if (selectedPosition) updateBortleScale(selectedPosition);
	}, [confirmPosition, additionalLocationInformation, selectedPosition]);

	const onCircleChange = useCallback(
		(e) => setSelectedPosition({ lat: e.lat(), lng: e.lng() }),
		[setSelectedPosition],
	);

	const onMarkerChange = useCallback(
		(e) =>
			setSelectedPosition({
				lat: e.latLng.lat(),
				lng: e.latLng.lng(),
			}),
		[setSelectedPosition],
	);

	const goToMyLocation = () =>
	{
		setIsLoading(true);
		navigator.geolocation.getCurrentPosition(
			(position) =>
			{
				const coordinates = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setCenter(coordinates);
				setSelectedPosition(coordinates);
				setZoom(12); // Zoom in closer to the user's location
				setIsLoading(false);
			},
			(err) =>
			{
				console.log(err);
				setIsLoading(false);
			}
		);
	};

	const toggleAccuracy = () =>
	{
		setAdditionalLocationInformation(prev => ({
			...prev,
			accuracy: prev.accuracy === LOCATION_ACCURACY.COARSE 
				? LOCATION_ACCURACY.PRECISE 
				: LOCATION_ACCURACY.COARSE
		}));
	};

	return (
		<Modal 
			open={open} 
			onClose={onSubmit}
			closeAfterTransition
		>
			<Fade in={open}>
				<Paper
					elevation={24}
					sx={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						width: '90vw',
						height: '85vh',
						bgcolor: '#1a1f2c', // Dark background
						borderRadius: 2,
						overflow: 'hidden',
						display: 'flex',
						flexDirection: { xs: 'column', md: 'row' },
						border: '1px solid rgba(255, 255, 255, 0.1)'
					}}
				>
					{/* Left Panel */}
					<Box
						sx={{
							width: { xs: '100%', md: '500px' },
							height: { xs: 'auto', md: '100%' },
							display: 'flex',
							justifyContent: 'space-between',
							flexDirection: 'column',
							p: 3,
							borderRight: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' },
							borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.1)', md: 'none' },
							zIndex: 1,
							backgroundColor: '#14161f' // Darker sidebar
						}}
					>
						<Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', mb: 2 }}>
							<IconButton 
								onClick={() => confirmPosition(null)} 
								size="small" 
								sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
							>
								<CloseIcon />
							</IconButton>
						</Box>

						<PlacesAutoComplete
							selectedPosition={selectedPosition}
							setAdditionalLocationInformation={setAdditionalLocationInformation}
							sx={{ mb: 3 }}
						/>

						<ObservatoryAddressBox
							locationData={{
								...additionalLocationInformation,
								...(selectedPosition ?? {}),
							}}
							setLocationData={setAdditionalLocationInformation}
							onSubmit={onSubmit}
							setSelectedPosition={setSelectedPosition}
							setPublicLocation={setPublicLocation}
							isPublicLocation={isPublicLocation}
						/>

					</Box>

					{/* Map Container */}
					<Box 
						sx={{ 
							flexGrow: 1, 
							position: 'relative',
							height: { xs: 'calc(85vh - 500px)', md: '100%' },
							bgcolor: '#14161f' // Dark background for map area
						}}
					>
						<GoogleMap
							zoom={zoom}
							onZoomChanged={(e) => setZoom(e.detail.zoom)}
							renderingType="RASTER"
							mapId="MAP_ID"
							id="MAP_ID"
							center={center}
							onCenterChanged={(e) => setCenter(e.detail.center)}
							onDblclick={(e) => setSelectedPosition(e.detail.latLng)}
							// options={{
							// 	fullscreenControl: false,
							// 	mapTypeControl: true,
							// 	mapTypeControlOptions: {
							// 		position: 3, // TOP_RIGHT
							// 	},
							// 	streetViewControl: false,
							// 	minZoom: 3,
							// 	maxZoom: 20,
							// 	styles: [
							// 		{ elementType: "geometry", stylers: [{ color: "#242f3e" }] },
							// 		{ elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
							// 		{ elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
							// 		{
							// 			featureType: "administrative.locality",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#d59563" }],
							// 		},
							// 		{
							// 			featureType: "poi",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#d59563" }],
							// 		},
							// 		{
							// 			featureType: "poi.park",
							// 			elementType: "geometry",
							// 			stylers: [{ color: "#263c3f" }],
							// 		},
							// 		{
							// 			featureType: "poi.park",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#6b9a76" }],
							// 		},
							// 		{
							// 			featureType: "road",
							// 			elementType: "geometry",
							// 			stylers: [{ color: "#38414e" }],
							// 		},
							// 		{
							// 			featureType: "road",
							// 			elementType: "geometry.stroke",
							// 			stylers: [{ color: "#212a37" }],
							// 		},
							// 		{
							// 			featureType: "road",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#9ca5b3" }],
							// 		},
							// 		{
							// 			featureType: "road.highway",
							// 			elementType: "geometry",
							// 			stylers: [{ color: "#746855" }],
							// 		},
							// 		{
							// 			featureType: "road.highway",
							// 			elementType: "geometry.stroke",
							// 			stylers: [{ color: "#1f2835" }],
							// 		},
							// 		{
							// 			featureType: "road.highway",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#f3d19c" }],
							// 		},
							// 		{
							// 			featureType: "transit",
							// 			elementType: "geometry",
							// 			stylers: [{ color: "#2f3948" }],
							// 		},
							// 		{
							// 			featureType: "transit.station",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#d59563" }],
							// 		},
							// 		{
							// 			featureType: "water",
							// 			elementType: "geometry",
							// 			stylers: [{ color: "#17263c" }],
							// 		},
							// 		{
							// 			featureType: "water",
							// 			elementType: "labels.text.fill",
							// 			stylers: [{ color: "#515c6d" }],
							// 		},
							// 		{
							// 			featureType: "water",
							// 			elementType: "labels.text.stroke",
							// 			stylers: [{ color: "#17263c" }],
							// 		},
							// 	],
							// }}
						>
							{selectedPosition &&
								(additionalLocationInformation.accuracy === LOCATION_ACCURACY.COARSE ? (
									<MapCircle
										radius={10000}
										center={selectedPosition}
										onCenterChanged={onCircleChange}
										strokeColor={Palette.blue}
										strokeOpacity={1}
										strokeWeight={3}
										fillColor={Palette.blue}
										fillOpacity={0.3}
										draggable
									/>
								) : (
									<AdvancedMarker
										position={selectedPosition}
										draggable
										onDragEnd={onMarkerChange}
									/>
								))}
						</GoogleMap>

						{/* Custom Map Controls */}
						{/* <Box sx={{ 
							position: 'absolute', 
							top: 16, 
							right: 16, 
							display: 'flex', 
							flexDirection: 'column',
							gap: 1
						}}>
							<Paper 
								elevation={4} 
								sx={{ 
									borderRadius: '50%', 
									bgcolor: 'rgba(20, 22, 31, 0.8)',
									backdropFilter: 'blur(4px)',
									border: '1px solid rgba(255, 255, 255, 0.1)'
								}}
							>
								<IconButton 
									onClick={goToMyLocation} 
									disabled={isLoading} 
									sx={{ color: Palette.orange }}
								>
									<MyLocationIcon />
								</IconButton>
							</Paper>
							<Paper 
								elevation={4} 
								sx={{ 
									borderRadius: '50%', 
									bgcolor: 'rgba(20, 22, 31, 0.8)',
									backdropFilter: 'blur(4px)',
									border: '1px solid rgba(255, 255, 255, 0.1)'
								}}
							>
								<IconButton 
									onClick={() => setZoom(prev => Math.min(prev + 1, 20))} 
									sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
								>
									<ZoomInIcon />
								</IconButton>
							</Paper>
							<Paper 
								elevation={4} 
								sx={{ 
									borderRadius: '50%', 
									bgcolor: 'rgba(20, 22, 31, 0.8)',
									backdropFilter: 'blur(4px)',
									border: '1px solid rgba(255, 255, 255, 0.1)'
								}}
							>
								<IconButton 
									onClick={() => setZoom(prev => Math.max(prev - 1, 3))} 
									sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
								>
									<ZoomOutIcon />
								</IconButton>
							</Paper>
						</Box> */}

					</Box>
				</Paper>
			</Fade>
		</Modal>
	);
};

export default Map;
