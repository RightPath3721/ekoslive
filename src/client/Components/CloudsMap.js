import React, { memo, useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, ImageOverlay, useMap } from "react-leaflet";
import { useSelector } from "react-redux";
import { selectLocation, selectUser } from "@redux/selectors";
import "leaflet/dist/leaflet.css";
import { Box } from "@mui/material";

const URL = process.env.REACT_APP_URL;
const getTileBounds = (x, y, zoom) =>
{
	const n = Math.pow(2, zoom);
	const lonMin = (x / n) * 360 - 180;
	const lonMax = ((x + 1) / n) * 360 - 180;
	const latRadMin = Math.PI * (1 - (2 * y) / n);
	const latRadMax = Math.PI * (1 - (2 * (y + 1)) / n);
	const latMin = (180 / Math.PI) * Math.atan(Math.sinh(latRadMin));
	const latMax = (180 / Math.PI) * Math.atan(Math.sinh(latRadMax));
	return [
		[latMin, lonMin],
		[latMax, lonMax],
	];
};

const CloudTilesLoader = ({ setCloudTiles, fetchCloudData, user }) =>
{
	const map = useMap();

	const lon2tile = (lon, zoom) =>
		Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));

	const lat2tile = (lat, zoom) =>
	{
		const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat)); // Clamp latitude
		const radians = (clampedLat * Math.PI) / 180;
		const mercator = Math.log(Math.tan(radians) + 1 / Math.cos(radians));
		return Math.floor(((1 - mercator / Math.PI) / 2) * Math.pow(2, zoom));
	};

	const loadCloudTiles = useCallback(async () =>
	{
		if (!user) return;

		const tiles = [];
		const bounds = map.getBounds();
		const zoom = Math.min(Math.max(3, map.getZoom()), 10); // Clamp zoom
		const maxTiles = Math.pow(2, zoom);

		// Clamp tile indices within bounds
		const xMin = Math.max(0, lon2tile(bounds.getWest(), zoom));
		const xMax = Math.min(maxTiles - 1, lon2tile(bounds.getEast(), zoom));
		const yMin = Math.max(0, lat2tile(bounds.getNorth(), zoom));
		const yMax = Math.min(maxTiles - 1, lat2tile(bounds.getSouth(), zoom));

		const tileFetchPromises = [];

		for (let x = xMin; x <= xMax; x++)
		{
			for (let y = yMin; y <= yMax; y++)
			{
				const tileData = {
					x,
					y,
					z: zoom,
					url: URL + `/tiles/clouds/${zoom}/${x}/${y}.webp`,
					bounds: getTileBounds(x, y, zoom),
				};
				tiles.push(tileData);
			}
		}

		try
		{
			await Promise.all(tileFetchPromises);
			setCloudTiles(() =>
			{
				// Replace the previous tiles entirely when zoom changes
				const tileSet = new Map();
				if (!tiles || !Array.isArray(tiles)) return;
				tiles.forEach((tile) =>
				{
					const key = `${tile.x}_${tile.y}_${tile.z}`;
					tileSet.set(key, tile);
				});
				return Array.from(tileSet.values());
			});
		}
		catch (error)
		{
			console.error("Error loading tiles:", error);
		}
	}, [user, fetchCloudData, map]);

	useEffect(() =>
	{
		loadCloudTiles(); // Load initial cloud tiles on map load

		const handleMoveEnd = () =>
		{
			loadCloudTiles();
		};

		const handleZoomEnd = () => loadCloudTiles();

		map.on("moveend", handleMoveEnd);
		map.on("zoomend", handleZoomEnd);

		return () =>
		{
			map.off("moveend", handleMoveEnd);
			map.off("zoomend", handleZoomEnd);
		};
	}, [map, loadCloudTiles]);

	return null;
};

const CloudsMap = ({ onClose }) =>
{
	const location = useSelector(selectLocation) || { latitude: 0, longitude: 0 };
	const user = useSelector(selectUser);
	const [cloudTiles, setCloudTiles] = useState([]);

	useEffect(() =>
	{
		const style = document.createElement("style");
		style.textContent = `
			  .leaflet-container {
				  background: none !important;
			  }
			  img.leaflet-tile, img.leaflet-marker-icon, img.leaflet-marker-shadow {
				  /* work-around from here: https://github.com/Leaflet/Leaflet/issues/161 */
				  outline: 1px solid transparent;
				  /* work-around from here: https://bugs.chromium.org/p/chromium/issues/detail?id=600120 */
				  mix-blend-mode: plus-lighter;
			  }
  			  .custom-tile {
  			  margin: 0;
  			  padding: 0;
  			  border: "1px";
  			  image-rendering: pixelated; 
	}
			`;
		document.head.appendChild(style);

		return () =>
		{
			document.head.removeChild(style);
		};
	}, []);

	return (
		<Box>
			<MapContainer
				center={[location.latitude, location.longitude]}
				zoom={6}
				minZoom={3}
				maxZoom={10}
				style={{ height: "100vh", width: "100%" }}
				maxBounds={[
					[-90, -180],
					[90, 180],
				]}
				whenCreated={(mapInstance) =>
				{
					mapRef.current = mapInstance;
				}}
			>
				<TileLayer
					tileSize={256}
					className="custom-tile"
					opacity={1}
					keepBuffer={10}
					url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
				/>
				<CloudTilesLoader setCloudTiles={setCloudTiles} user={user} />
				{cloudTiles.map(({ url, bounds }, idx) => (
					<ImageOverlay
						key={idx}
						url={url}
						bounds={bounds}
						opacity={0.6}
						style={{
							objectFit: "cover",
							imageRendering: "auto",
							margin: 0,
							border: "1px solid red",
						}}
					/>
				))}
			</MapContainer>
		</Box>
	);
};

export default memo(CloudsMap);
