import React, { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSelector } from "react-redux";
import { selectLocation } from "@redux/selectors";

const URL = process.env.REACT_APP_URL;

const LightPollutionMap = ({ onClose }) =>
{
	const location = useSelector(selectLocation) || { latitude: 0, longitude: 0 };

	useEffect(() =>
	{
		// Initialize base layers
		const osm = L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
			attribution:
				'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
			minZoom: 3,
			maxZoom: 10,
		});

		// Overlay layer
		const lyr = L.tileLayer(URL + "/tiles/light/{z}/{x}/{y}.webp", {
			tms: true,
			opacity: 0.8,
			attribution: "",
			minZoom: 3,
			maxZoom: 10,
		});

		// Initialize map
		const map = L.map("map", {
			center: [location.latitude, location.longitude],
			zoom: 7,
			minZoom: 3,
			maxZoom: 10,
			layers: [osm, lyr],
		});

		map.setView([location.latitude, location.longitude], 7);

		// Set map bounds to restrict dragging
		const southWest = L.latLng(-55, -360); // Adjust to define the lower bound
		const northEast = L.latLng(75, 360); // Adjust to define the upper bound
		const bounds = L.latLngBounds(southWest, northEast);

		// Limit panning to bounds
		map.setMaxBounds(bounds);

		// Optional: Prevent dragging outside the bounds
		map.on("drag", function ()
		{
			map.panInsideBounds(bounds, { animate: false });
		});

		return () =>
		{
			map.remove(); // Cleanup map instance on component unmount
		};
	}, [onClose]);

	return <div id="map" style={{ width: "100%", height: "100vh" }}></div>;
};

export default LightPollutionMap;
