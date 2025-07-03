import isEmpty from "lodash/isEmpty";
import OutlinedInput from "@mui/material/OutlinedInput";
import { captureException } from "@sentry/browser";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import React, { useEffect, useRef, useState } from "react";
import useThrottle from "@hooks/useThrottle";

const PlacesAutoComplete = ({
	selectedPosition,
	setAdditionalLocationInformation,
}) =>
{
	const inputRef = useRef(null);
	const geocoder = useMapsLibrary("geocoding");
	const [geocoderApi, setGeocoderApi] = useState(null);

	useEffect(() =>
	{
		if (!geocoder || !inputRef.current) return;

		setGeocoderApi(new geocoder.Geocoder());
	}, [geocoder]);

	useEffect(() =>
	{
		if (!geocoderApi) return;

		getAddressFromCoords(selectedPosition);
	}, [selectedPosition]);

	const getAddressFromCoords = useThrottle((position) =>
	{
		if (!geocoderApi) return;

		geocoderApi
			.geocode({ location: position })
			.then((response) =>
			{
				const parserdResponse = response.results
					.map((result) =>
					{
						const country = result.address_components.find((component) =>
							component.types.includes("country"),
						)?.long_name;
						const addressComponents = result.address_components.filter(
							(component) => !component.types.includes("country"),
						);
						const address = addressComponents
							.map((component) =>
							{
								return component.long_name;
							})
							.join(", ");

						if (!country || !addressComponents.length || !address) return null;
						return {
							country,
							address,
							location: result.geometry.location,
						};
					})
					.filter((element) => element);
				if (parserdResponse)
				{
					if (parserdResponse.length > 2)
					{
						const result = parserdResponse[parserdResponse.length - 2];
						setAdditionalLocationInformation((prevData) => ({
							...prevData,
							country: result.country,
							region: result.address,
						}));
					}
					else if (isEmpty(parserdResponse))
					{
						setAdditionalLocationInformation((prevData) => ({
							...prevData,
							country: "N/A",
							region: "N/A",
						}));
					}
					else
					{
						const result = parserdResponse[parserdResponse.length - 1];
						setAdditionalLocationInformation((prevData) => ({
							...prevData,
							country: result.country,
							region: result.address,
						}));
					}
				}
			})
			.catch(captureException);
	}, 1500);

	return (
		<div className="autocomplete-container" style={{ display: "none" }}>
			<OutlinedInput inputRef={inputRef} />
		</div>
	);
};

export default PlacesAutoComplete;
