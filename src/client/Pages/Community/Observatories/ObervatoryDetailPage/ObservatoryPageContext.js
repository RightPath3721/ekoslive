import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import useObservatoryAPI from "@hooks/useObservatoryAPI";
import useActiveUser from "@hooks/useActiveUser";

const initialData = {
	observatory: null,
	setObservatory: () =>
	{},
	observatoryPermissions: { canEdit: false, isOwner: false },
};

const ObservatoryPageContext = createContext(initialData);

export const useObservatoryPageContext = () =>
	useContext(ObservatoryPageContext);

const ObservatoryPageContextProvider = ({ children }) =>
{
	const user = useActiveUser();
	const { observatoryNameId } = useParams();
	const observatoryId = observatoryNameId.split("-").pop();
	const { observatory, setObservatory } = useObservatoryAPI(observatoryId);
	const [observatoryPermissions, setObservatoryPermissions] = useState({
		canEdit: false,
		isOwner: false,
	});

	useEffect(() =>
	{
		if (!observatoryId || !user) return;

		(async () =>
		{
			try
			{
				const { data } = await axios.get(
					`/api/observatories/check-owner/${observatoryId}`,
					{
						params: {
							username: user.username,
							token: user.token,
						},
					},
				);
				setObservatoryPermissions(data);
			}
			catch
			{
				setObservatoryPermissions({ canEdit: false, isOwner: false });
			}
		})();
	}, [observatoryId, user]);

	return (
		<ObservatoryPageContext.Provider
			value={{
				observatory,
				setObservatory,
				observatoryPermissions,
			}}
		>
			{children}
		</ObservatoryPageContext.Provider>
	);
};

export default ObservatoryPageContextProvider;
