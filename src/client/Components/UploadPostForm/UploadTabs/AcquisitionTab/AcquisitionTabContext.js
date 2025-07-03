import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useState,
} from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { useUploadFormContext } from "../../UploadFormContext";
import useActiveUser from "@hooks/useActiveUser";

const AcquisionContext = createContext({
	filter: null,
	setFilter: () =>
	{},
	filters: null,
	setFilters: () =>
	{},
	submit: () =>
	{},
	dispatchFormState: () =>
	{},
	formState: {},
	filtersList: [],
	setFiltersList: () =>
	{},
});

const initValues = {
	frames: 0,
	duration: 0,
	binning: null,
	gain: null,
	timestamp: null,
};

const reducer = (state, action) =>
{
	if (action === "reset") return initValues;
	return { ...state, [action.name]: action.value };
};

export const useAcquisitionContext = () => useContext(AcquisionContext);

const AcquisionContextProvider = ({ children }) =>
{
	const user = useActiveUser();
	const { observatory, equipmentProfile, filters, setFilters } =
		useUploadFormContext();
	const [filter, setFilter] = useState(null);
	const [formState, dispatchFormState] = useReducer(reducer, initValues);
	const [filtersList, setFiltersList] = useState([]);

	const submit = useCallback(() =>
	{
		setFilters((prev) => [...prev, formState]);
	}, [formState, setFilters]);

	useEffect(() =>
	{
		if (!filter) return;
		dispatchFormState({
			name: "label",
			value: filter ? filter.label : "no_filter",
		});
	}, [filter]);

	useEffect(() =>
	{
		if (!observatory || !equipmentProfile || !user) return;

		(async () =>
		{
			try
			{
				const url = `/api/equipments/${observatory}/${equipmentProfile}/filter?username=${encodeURIComponent(user.username)}&token=${user.token}`;
				const { data } = await axios.get(url);
				setFiltersList(
					data
						.filter(
							(item) =>
								item.label &&
								item._id &&
								item.equipment_type &&
								item.equipment_type.name.toLowerCase() === "filter",
						)
						.map((item) => ({
							label: item.label,
							_id: item._id,
						})),
				);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, [equipmentProfile, observatory, user, setFiltersList]);

	return (
		<AcquisionContext.Provider
			value={{
				filter,
				setFilter,
				filters,
				setFilters,
				submit,
				dispatchFormState,
				formState,
				filtersList,
				setFiltersList,
			}}
		>
			{children}
		</AcquisionContext.Provider>
	);
};

export default AcquisionContextProvider;
