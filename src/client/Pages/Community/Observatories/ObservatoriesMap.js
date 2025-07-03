import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useState,
} from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import unionBy from "lodash/unionBy";
import { Map } from "@vis.gl/react-google-maps";
import Box from "@mui/material/Box";
import { useMediaQuery } from "react-responsive";
import { useObservatoriesContext } from "./ObservatoriesContext";
import { LOCATION_ACCURACY } from "@client/helpers/common";
import MapCircle from "@components/MapCircle";
import MapMarkerWithWindow from "@components/MapMarkerWithWindow";
import ObservatoryWindow from "./ObservatoryWindow";

const ObservatoriesMap = forwardRef(({ mapCenter, setMapCenter }, ref) =>
{
	const isMediumScreen = useMediaQuery({ query: "(min-width: 768px)" });
	const { observatories } = useObservatoriesContext();
	const [observatoriesData, setObservatoriesData] = useState([]);
	const [zoom, setZoom] = useState(8);

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const { data } = await axios.get(`/api/observatories/locations`, {
					params: {
						observatories: observatories.map((observatory) => observatory._id),
					},
				});
				setObservatoriesData((prevData) =>
					unionBy(
						prevData,
						data?.filter?.(
							(observatory) =>
								observatory.location && observatory.isPublicLocation,
						) ?? [],
						"_id",
					),
				);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [observatories]);

	useImperativeHandle(ref, () =>
	{
		return (observatoryId) =>
			observatoriesData.find((observatory) => observatory._id === observatoryId)
				?.location ?? null;
	}, [observatoriesData]);

	if (!observatories?.length || !isMediumScreen) return null;

	return (
		<Box
			id="observatory_map"
			sx={{ width: "100%", height: "550px", position: "sticky", top: "100px" }}
		>
			<Map
				zoom={zoom}
				onZoomChanged={(e) =>
				{
					setZoom(e.detail.zoom);
				}}
				renderingType="RASTER"
				mapId="OBSERVATORIES_MAP_ID"
				id="OBSERVATORIES_MAP_ID"
				center={mapCenter}
				onCenterChanged={(e) => setMapCenter(e.detail.center)}
			>
				{observatoriesData.map((observatory) =>
				{
					if (observatory.location.accuracy === LOCATION_ACCURACY.COARSE)
					{
						return (
							<MapCircle
								radius={10000}
								center={{
									lat: observatory.location.lat,
									lng: observatory.location.lng,
								}}
								strokeColor="#0c4cb3"
								strokeOpacity={1}
								strokeWeight={3}
								fillColor="#3b82f6"
								fillOpacity={0.3}
								key={observatory._id}
							/>
						);
					}
					else
					{
						return (
							<MapMarkerWithWindow
								position={{
									lat: observatory.location.lat,
									lng: observatory.location.lng,
								}}
								title={observatory.name}
								key={observatory._id}
								maxWidth={250}
							>
								<ObservatoryWindow observatory={observatory} />
							</MapMarkerWithWindow>
						);
					}
				})}
			</Map>
		</Box>
	);
});

export default ObservatoriesMap;
