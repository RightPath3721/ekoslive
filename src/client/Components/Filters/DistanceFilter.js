import React, { useEffect, useState } from "react";
import MinimumDistanceSlider from "@components/MinimumDistanceSlider";

const DistanceSlider = ({ handleFilterChange }) =>
{
	const [value, setValue] = useState(null);
	const [userPosition, setUserPosition] = useState(null);

	useEffect(() =>
	{
		navigator.geolocation.getCurrentPosition(
			(position) =>
			{
				const { lat, lng } = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
				};
				setUserPosition({ lat, lng });
			},
			(err) =>
			{
				console.log(err);
			},
		);
	}, []);

	const handleSliderChange = (value) =>
	{
		setValue(value);
		if (!userPosition) return;
		handleFilterChange("location", [userPosition?.lat, userPosition?.lng]);
		handleFilterChange("radius", value[1]);
	};

	return (
		<MinimumDistanceSlider
			minDistance={10}
			value={value}
			setValue={handleSliderChange}
			step={5}
			max={1000}
			min={10}
			disabled={!userPosition}
		/>
	);
};

export default DistanceSlider;
