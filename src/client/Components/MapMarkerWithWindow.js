import React, { useState } from "react";
import {
	AdvancedMarker,
	InfoWindow,
	useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";

const MapMarkerWithWindow = ({ title, position, maxWidth = 200, children }) =>
{
	const [infowindowOpen, setInfowindowOpen] = useState(false);
	const [markerRef, marker] = useAdvancedMarkerRef();

	return (
		<>
			<AdvancedMarker
				ref={markerRef}
				onClick={() => setInfowindowOpen(true)}
				position={position}
				title={title}
			/>
			{infowindowOpen && (
				<InfoWindow
					anchor={marker}
					maxWidth={maxWidth}
					onCloseClick={() => setInfowindowOpen(false)}
				>
					{children}
				</InfoWindow>
			)}
		</>
	);
};

export default MapMarkerWithWindow;
