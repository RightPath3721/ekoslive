import React, { useEffect, useState } from "react";
import { GetCountries, GetState, GetCity } from "react-country-state-city";

const CitySelector = ({ register }) =>
{
	const [country, setCountry] = useState(null);
	const [state, setState] = useState({ id: 0, name: "" });
	const [city, setCity] = useState({ id: 0, name: "" });

	const [countriesList, setCountriesList] = useState([]);
	const [stateList, setStateList] = useState([]);
	const [cityList, setCityList] = useState([]);

	useEffect(() =>
	{
		GetCountries().then((result) =>
		{
			setCountriesList(result);
		});
	}, []);

	return (
		<>
			<label className="label">
				Country
				<select
					{...register("country", {
						onChange: (e) =>
						{
							const country = countriesList.find(
								(country) => country.name === e.target.value,
							);
							setCountry({ id: country.id, name: country.name });
							GetState(country.id).then((result) =>
							{
								setStateList(result);
							});
						},
					})}
					value={country?.name ?? ""}
					className="select"
				>
					{countriesList.map((item) => (
						<option className="select-option" key={item.id} value={item.name}>
							{item.name}
						</option>
					))}
				</select>
			</label>

			{stateList.length > 0 && (
				<label className="label">
					State
					<select
						{...register("state", {
							onChange: (e) =>
							{
								const state = stateList.find(
									(state) => state.name === e.target.value,
								);
								setState({ id: state.id, name: state.name });
								GetCity(country.id, state.id).then((result) =>
								{
									setCityList(result);
								});
							},
						})}
						value={state.name}
						className="select"
						name="state"
					>
						{stateList.map((item) => (
							<option className="select-option" key={item.id} value={item.name}>
								{item.name}
							</option>
						))}
					</select>
				</label>
			)}

			{cityList.length > 0 && (
				<label className="label">
					City
					<select
						{...register("city", {
							onChange: (e) =>
							{
								const city = cityList.find(
									(city) => city.name === e.target.value,
								);
								setCity({ id: city.id, name: city.name });
							},
						})}
						value={city.name}
						className="select"
						name="city"
					>
						{cityList.map((item) => (
							<option className="select-option" key={item.id} value={item.name}>
								{item.name}
							</option>
						))}
					</select>
				</label>
			)}
		</>
	);
};

export default CitySelector;
