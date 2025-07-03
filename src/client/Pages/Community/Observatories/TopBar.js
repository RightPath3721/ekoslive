import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import pickBy from "lodash/pickBy";
import identity from "lodash/identity";
import unionBy from "lodash/unionBy";
import intersectionBy from "lodash/intersectionBy";
import keyBy from "lodash/keyBy";
import { captureException } from "@sentry/browser";
import Filters from "@components/Filters/Filters";
import useObservatories from "@hooks/useObservatories";
import { useObservatoriesContext } from "./ObservatoriesContext";
import { useCurrentProfileContext } from "../CurrentProfileContext";

export const Lists = {
	PUBLIC: 0,
	MY_OBSERVATORIES: 1,
};

const mergeObservatories = (array1, array2) =>
{
	const lookup = keyBy(array2, "_id");
	return array1.map((observatory) =>
	{
		return lookup[observatory._id] ?? observatory;
	});
};

const TopBar = ({ list, setTabs, setActiveList }) =>
{
	const { getFilteredObservatories, getObservatories } = useObservatories();
	const [filtersData, setFiltersData] = useState([]);
	const [sortDirection, setSortDirection] = useState("asc");
	const { nickname } = useParams();
	const { profile } = useCurrentProfileContext();
	const { setObservatories, setItemsCount, setCurrentPage, currentPage } =
		useObservatoriesContext();

	useEffect(() =>
	{
		(async () =>
		{
			try
			{
				const { data } = await axios.get("/api/equipments/filters/observatory");
				setFiltersData(data);
			}
			catch (error)
			{
				captureException(error);
			}
		})();
	}, []);

	useEffect(() =>
	{
		if (list === Lists.MY_OBSERVATORIES)
		{
			fetchUserObservatories();
		}
		else
		{
			fetchPublicObservatories();
		}
	}, [list, profile, nickname]);

	useEffect(() => {
		// If there's no profile data, we should only show the Public tab
		if (!profile) {
			setActiveList(Lists.PUBLIC);
			setTabs("default"); // Use default instead of expanded to show only Public
			return;
		}
		
		// Check if this is the current user's profile page
		const isUserPage =
			profile.social_nickname?.replace?.("@", "") === nickname ||
			nickname === "profile";
			
		if (isUserPage) {
			// This is the user's own profile, show both tabs with My Observatories active
			setActiveList(Lists.MY_OBSERVATORIES);
			setTabs("expanded"); // Show both tabs
		} else {
			// This is someone else's profile or public view, only show Public tab
			setActiveList(Lists.PUBLIC);
			setTabs("default"); // Show only Public tab
		}
	}, [profile, nickname, setActiveList, setTabs]);

	const fetchObservatories = useCallback(
		async (filters) =>
		{
			if (list === Lists.PUBLIC)
			{
				fetchPublicObservatories(filters);
			}
			else
			{
				fetchUserObservatories(filters);
			}
		},
		[
			fetchPublicObservatories,
			fetchUserObservatories,
			list,
			currentPage,
			nickname,
		],
	);

	const fetchUserObservatories = useCallback(
		async (filters = {}) =>
		{
			try
			{
				const observatories = await getObservatories();
				const { data } = await getFilteredObservatories({
					...pickBy(filters, identity),
					sort_by: "name",
					sort_direction: filters?.sort_direction || sortDirection,
					page: 0,
					limit: 1000,
				});
				const mergedData = intersectionBy(observatories, data, "_id");
				setObservatories(mergedData);
				setCurrentPage(0);
				setItemsCount(0);
			}
			catch (error)
			{
				captureException(error, { addAttachment: { filters } });
			}
		},
		[
			getObservatories,
			getFilteredObservatories,
			setObservatories,
			setCurrentPage,
			setItemsCount,
			sortDirection,
		],
	);

	const fetchPublicObservatories = useCallback(
		async (filters = {}) =>
		{
			try
			{
				const { data, count } = await getFilteredObservatories({
					...pickBy(filters, identity),
					sort_by: "name",
					sort_direction: filters?.sort_direction || sortDirection,
					page: currentPage,
					visibility: true,
				});
				if (!profile)
				{
					setItemsCount(count);
					setObservatories((prevData) =>
						currentPage === 0 ? data : unionBy(prevData, data, "_id"),
					);
					return;
				}
				const { data: userObservatories } = await axios.get(
					`/api/observatories/profile/${nickname === "profile" ? encodeURIComponent(profile?.social_nickname?.replace("@", "")) : encodeURIComponent(nickname)}`,
				);

				const filteredObservatoriesData =
					nickname === "profile" ||
					nickname === profile?.social_nickname?.replace("@", "")
						? data
						: mergeObservatories(userObservatories, data);
				setItemsCount(count);
				if (
					nickname === "profile" ||
					nickname === profile?.social_nickname?.replace("@", "")
				)
				{
					setObservatories((prevData) =>
						currentPage === 0
							? filteredObservatoriesData
							: unionBy(prevData, filteredObservatoriesData, "_id"),
					);
				}
				else
				{
					setObservatories(filteredObservatoriesData);
				}
			}
			catch (error)
			{
				setObservatories([]);
				setItemsCount(0);
				captureException(error, { addAttachment: { filters } });
			}
		},
		[
			getFilteredObservatories,
			setObservatories,
			setItemsCount,
			currentPage,
			nickname,
			profile,
			sortDirection,
		],
	);

	return (
		<Filters
			fetchData={fetchObservatories}
			filtersData={filtersData}
			setPage={setCurrentPage}
			page={currentPage}
			setSortDirection={setSortDirection}
		/>
	);
};

export default TopBar;
