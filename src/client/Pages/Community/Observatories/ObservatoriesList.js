import React, { useCallback, useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { selectUser } from "@redux/selectors";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import { planType } from "@indi/enums";
import { useSelector } from "react-redux";
import { useObservatoriesContext } from "./ObservatoriesContext";
import ListView from "@components/ListView";
import ObservatoriesMap from "./ObservatoriesMap";
import TopBar, { Lists } from "./TopBar";
import ToggleViewButtons from "@components/ToggleViewButtons";
import { styles } from "@client/shared/styles";
import TabsView from "@components/TabsView";
import AddObservatoryItem from "./AddObservatoryItem";
import NoObservatories from "./NoObservatories";
import { useMediaQuery } from "react-responsive";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";

const ObservatoriesList = ({ view, toggleView }) =>
{
	const navigate = useNavigate();
	const user = useSelector(selectUser);
	const { palette } = useTheme();
	const isMediumScreen = useMediaQuery({ query: "(min-width: 768px)" });
	const [activeList, setActiveList] = useState(Lists.PUBLIC);
	const {
		observatories,
		itemsCount,
		setCurrentPage,
		currentPage,
		setObservatories,
	} = useObservatoriesContext();
	const mapRef = useRef(null);
	const [mapCenter, setMapCenter] = useState({ lat: 53.54992, lng: 10.00678 });
	const [tabsList, setTabsList] = useState("default");
	const { nickname } = useParams();
	const [isLoading, setIsLoading] = useState(true);

	const handleObservatoryLocationClick = useCallback(
		(observatory) =>
		{
			if (!observatory.location || !mapRef.current) return;

			const location = mapRef.current(observatory._id);

			if (location)
			{
				setMapCenter({
					lat: location.lat,
					lng: location.lng,
				});
			}
		},
		[setMapCenter, mapRef],
	);

	const checkObservatoryLocation = useCallback(
		(observatory) => observatory.location && observatory.isPublicLocation,
		[],
	);

	const breadcrumbs = (username, observatoryName) =>
	{
		return [
			{
				name: "Community",
				link: "/community",
			},
			{
				name: "Observatories",
				link: `/community/${username}/observatories`,
			},
			{
				name: observatoryName,
				link: `/community/${username}/observatories`,
			},
		];
	};

	const handleImageClick = useCallback(
		(observatory) =>
			navigate(`${nameConvertorForURL(observatory.name) + '-' + observatory._id}`, {
				state: breadcrumbs(nickname, observatory.name),
			}),
		[navigate],
	);

	const handleListChange = useCallback(
		(_, value) => {
			if (value !== null) {
				setActiveList(value);
				setCurrentPage(0); // Reset to page 0 when switching lists
				setObservatories([]); // Clear existing observatories
			}
		},
		[setActiveList, setCurrentPage, setObservatories]
	);

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xxs: "1fr", md: "repeat(2, 1fr)" },
				rowGap: "2rem",
				columnGap: isMediumScreen ? "2rem" : 0,
				padding: { xxs: ".5rem", xs: "1rem", sm: "1.5rem" },
				marginTop: { xxs: "1rem", md: 0 },
			}}
		>
			{tabsList === "expanded" ? (
				<Box
					sx={[
						styles.center,
						{
							width: "100%",
							justifyContent: "space-between",
							gridColumn: "1 / 3",
						},
					]}
				>
					<TabsView
						tabValue={activeList}
						tabs={[
							{ value: Lists.PUBLIC, label: "Public" },
							{ value: Lists.MY_OBSERVATORIES, label: "My Observatories" },
						]}
						handleChange={handleListChange}
					/>
					<ToggleViewButtons toggleView={toggleView} view={view} />
				</Box>
			) : (
				<Box
					sx={[
						styles.center,
						{
							width: "100%",
							justifyContent: "flex-end",
							gridColumn: "1 / 3",
						},
					]}
				>
					<ToggleViewButtons toggleView={toggleView} view={view} />
				</Box>
			)}
			<Box sx={{ display: "flex", flexDirection: "column" }}>
				{user && user.plan_id === planType.DEFAULT && <CurrentPlanInformer />}
				{user && user.plan_id === planType.PRO_PLAN && (
					<CurrentPlanInformer text="Unlimited observatories with Ultimate Plan" />
				)}
				<ListView
					data={observatories || []}
					itemsRemaining={itemsCount - 10 * (currentPage + 1)}
					setPage={setCurrentPage}
					iconAction={handleObservatoryLocationClick}
					icon={
						<GpsFixedIcon
							style={{ color: palette.white[900], fontSize: "1rem" }}
						/>
					}
					columns={view == "grid" ? 2 : 1}
					iconCondition={checkObservatoryLocation}
					handleImageClick={handleImageClick}
					view={view}
					prependChilren={
						activeList === Lists.MY_OBSERVATORIES ? (
							<AddObservatoryItem
								setObservatories={setObservatories}
								observatories={observatories ? observatories : null}
							/>
						) : null
					}
					containerStylesOverrides={{ 
						gridTemplateRows: "min-content",
						gridTemplateColumns: view === "grid" ? "repeat(2, 1fr)" : "1fr",
						gap: "1rem"
					}}
				/>
				{!observatories?.length && <NoObservatories />}
			</Box>

			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "1.5rem",
					gridRow: isMediumScreen ? "auto" : "2",
					gridColumn: isMediumScreen ? "auto" : "span 2",
				}}
			>
				<TopBar
					list={activeList}
					setTabs={setTabsList}
					setActiveList={setActiveList}
					setIsLoading={setIsLoading}
				/>
				{observatories?.length > 0 && (
					<ObservatoriesMap
						mapCenter={mapCenter}
						setMapCenter={setMapCenter}
						ref={mapRef}
					/>
				)}
			</Box>
		</Box>
	);
};

export default ObservatoriesList;
