import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import useActiveUser from "@hooks/useActiveUser";
import useThrottle from "@hooks/useThrottle";
import axios from "axios";
import { captureException } from "@sentry/browser";
import MapCircle from "@components/MapCircle";
import { LOCATION_ACCURACY } from "@client/helpers/common";
import PlacesAutoComplete from "@components/PlacesAutoComplete";

const Map = ({
	confirmPosition,
	defaultPosition = null,
	setBortleScale,
	setAdditionalLocationInformation,
	additionalLocationInformation,
}) =>
{
	const user = useActiveUser();
	const [zoom, setZoom] = useState(6);
	const [center, setCenter] = useState(
		defaultPosition ?? { lat: 53.54992, lng: 10.00678 },
	);
	const [selectedPosition, setSelectedPosition] = useState();

	useEffect(() =>
	{
		if (defaultPosition) return;
		navigator.geolocation.getCurrentPosition(
			(position) =>
			{
				const coordinates = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setCenter(coordinates);
				setSelectedPosition(coordinates);
				confirmPosition?.(coordinates);
			},
			(err) =>
			{
				console.log(err);
			},
		);
	}, [defaultPosition, confirmPosition]);

	useEffect(() => {
		if (selectedPosition) {
			confirmPosition?.({
				...additionalLocationInformation,
				...selectedPosition,
			});
		}
	}, [selectedPosition, additionalLocationInformation, confirmPosition]);

	const updateBortleScale = useThrottle(async ({ lat, lng }) =>
	{
		if (!user) return;
		
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

	const onCircleChange = useCallback(
		(e) =>
		{
			const position = {
				lat: e.lat(),
				lng: e.lng(),
			};

			setSelectedPosition(position);
			confirmPosition({
				...additionalLocationInformation,
				...(position ?? {}),
			});
			updateBortleScale(position);
		},
		[setSelectedPosition, additionalLocationInformation],
	);

	const onMarkerChange = useCallback(
		(e) =>
		{
			const position = {
				lat: e.latLng.lat(),
				lng: e.latLng.lng(),
			};
			setSelectedPosition(position);
			confirmPosition({
				...additionalLocationInformation,
				...(position ?? {}),
			});
			updateBortleScale(position);
		},
		[setSelectedPosition, additionalLocationInformation],
	);

	return (
		<Box sx={{ width: "100%", height: "100%" }}>
			<GoogleMap
				zoom={zoom}
				onZoomChanged={(e) =>
				{
					setZoom(e.detail.zoom);
				}}
				renderingType="RASTER"
				mapId="MAP_ID"
				id="MAP_ID"
				center={center}
				onCenterChanged={(e) => setCenter(e.detail.center)}
				onDblclick={(e) => {
					setSelectedPosition(e.detail.latLng);
				}}
			>
				{selectedPosition &&
					(additionalLocationInformation.accuracy ===
					LOCATION_ACCURACY.COARSE ? (
						<MapCircle
							radius={10000}
							center={selectedPosition}
							onCenterChanged={onCircleChange}
							strokeColor="#0c4cb3"
							strokeOpacity={1}
							strokeWeight={3}
							fillColor="#3b82f6"
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
			<Box display="none">
				<PlacesAutoComplete
					selectedPosition={selectedPosition}
					setAdditionalLocationInformation={setAdditionalLocationInformation}
				/>
			</Box>
		</Box>
	);
};

export default Map;
