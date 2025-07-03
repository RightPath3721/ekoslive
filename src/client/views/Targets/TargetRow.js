import React, { memo, useEffect, useState } from "react";
import { get, isArray, isEmpty, isEqual } from "lodash";
import { useDispatch, useSelector, useStore } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Unstable_Grid2 from "@mui/material/Unstable_Grid2";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import commands from "@commands";
import {
	alignActions,
	mountActions,
	schedulerActions,
	targetsActions,
} from "@redux/actions";
import {
	selectMountStatus,
	selectMountTarget,
	selectAlignState,
	selectConnectionOnline,
	selectTargetsListNames,
} from "@redux/selectors";
import Icon from "../../Components/Icon";
import s from "@common/shared/i18n/i18n";
import TargetImage from "./TargetImage";
import TargetPlot from "./TargetPlot";
import Circumpolar from "../../Components/Circumpolar";

/**
 * Sometimes Ekos find VERY CLOSE targets that are not exactly the same.
 * Here we treat them as same target. This is added on exception basis.
 * @type {{M71: string}}
 */
const alternativeDesignations = {
	"M 71": "NGC 6839",
	"NGC 2239": "NGC 2244",
};

const isSameTarget = (target, info) =>
{
	// Compare name first
	if (target.localeCompare(info.name, undefined, { sensitivity: "base" }) === 0)
		return true;

	// Now compare designations
	for (const oneDesignation of info.designations)
	{
		if (
			target.localeCompare(oneDesignation, undefined, {
				sensitivity: "base",
			}) === 0
		)
			return true;
	}

	// Check in alternative designations.
	return get(alternativeDesignations, info.name, null) === target;
};

const TargetRow = ({
	target,
	almanac,
	rise,
	observability,
	datetime,
	activeList,
	setListsPopup,
	addToList,
}) =>
{
	const dispatch = useDispatch();
	const mountStatus = useSelector(selectMountStatus, isEqual);
	const mountTarget = useSelector(selectMountTarget);
	const alignStatus = useSelector(selectAlignState);

	// Is Ekos online now?
	const ekosRunning = useSelector(selectConnectionOnline);
	const store = useStore();

	const [goRequested, setGoRequested] = useState(false);
	const [slewRequested, setSlewRequested] = useState(false);
	const [solveRequested, setSolveRequested] = useState(false);
	const [hourAngle, setHourAngle] = useState(0);
	const [borderColor, setBorderColor] = useState(Palette.grey99);

	const isBusy = goRequested || solveRequested || slewRequested;
	/** Change border color in accordance to align status to indicate progress and results. */
	useEffect(() =>
	{
		if (isSameTarget(mountTarget, target.info))
		{
			if (alignStatus === "Complete")
			{
				setSolveRequested(false);
			}
			else if (alignStatus === "Failed" || alignStatus === "Aborted")
			{
				setGoRequested(false);
				setSolveRequested(false);
				setSlewRequested(false);
			}
		}
	}, [alignStatus]);

	const preview = get(target, "metadata.preview", null);
	let imageSource = null;
	if (preview)
	{
		imageSource = {
			uri: preview,
		};
	}

	const lists = useSelector(selectTargetsListNames);
	// keeps track of whether the object is in favorites or not (for the icon)
	const [isFavorite, setIsFavorite] = useState(false);
	// Need to make this depends on activeList. Otherwise it will not redraw
	// and will use whatever isFavorite was for what row #
	useEffect(() =>
	{
		if (isArray(lists) && !isEmpty(lists))
		{
			for (const oneList of lists)
			{
				if (oneList.name === "Favorites")
				{
					const fav =
						oneList.payload.findIndex((name) =>
							isSameTarget(name, target.info),
						) !== -1;
					setIsFavorite(fav);
				}
			}
		}
	}, [lists]);

	/* Change border color in accordance to align status to indicate progress and results */
	useEffect(() =>
	{
		if (isSameTarget(mountTarget, target.info) || solveRequested)
		{
			if (alignStatus === "Idle") setBorderColor(Palette.grey99);
			else if (alignStatus === "In Progress") setBorderColor("yellow");
			else if (alignStatus === "Complete")
			{
				setBorderColor(Palette.green);
				setSolveRequested(false);
			}
			else if (alignStatus === "Failed" || alignStatus === "Aborted")
			{
				setBorderColor("red");
				setGoRequested(false);
				setSolveRequested(false);
				setSlewRequested(false);
			}
		}
	}, [alignStatus, mountTarget]);

	useEffect(() =>
	{
		if (observability)
			setHourAngle(
				observability.ha > 12 ? observability.ha - 24 : observability.ha,
			);
	}, [observability]);

	const toggleFavorites = (target) =>
	{
		let favorites = [];
		for (const oneList of lists)
		{
			if (oneList.name === "Favorites")
			{
				const index = oneList?.payload.indexOf(target.info.name);

				if (index !== -1) oneList.payload.splice(index, 1);
				else oneList.payload.push(target.info.name);

				favorites.push({
					...oneList,
					updatedAt: +new Date(),
					uuid: oneList.name,
				});
			}
			else favorites.push({ ...oneList });
		}
		dispatch(targetsActions.setLists(favorites));
	};

	const solve = (solverAction) =>
	{
		switch (solverAction)
		{
			case 0:
				dispatch(alignActions.setAllSettings({ syncR: true }));
				break;
			case 2:
				dispatch(alignActions.setAllSettings({ nothingR: true }));
				break;
			default:
				dispatch(alignActions.setAllSettings({ slewR: true }));
				break;
		}

		dispatch(alignActions.solve());
	};

	const abort = () =>
	{
		setBorderColor(Palette.grey99);
		setGoRequested(false);
		setSolveRequested(false);
		setSlewRequested(false);
		dispatch(mountActions.stop());
		dispatch(alignActions.stop());
	};

	/**
	 * Go and Solve once we arrived at destination.
	 */
	const go = () =>
	{
		if (isSameTarget(mountTarget, target.info)) solve(1);
		else
		{
			setBorderColor(Palette.magenta);
			setGoRequested(true);
			dispatch(mountActions.unpark());
			dispatch(mountActions.gotoTarget(target.info.name));
		}
	};

	/**
	 * Simply slew. Do not perform any alignment.
	 */
	const slew = () =>
	{
		// If we are *already* on the same target, we immediately set it to green since we might not get any mount status
		// updates and we could end up stuck in magenta.
		if (isSameTarget(mountTarget, target.info))
		{
			setBorderColor(Palette.green);
		}
		else
		{
			setBorderColor(Palette.magenta);
			setSlewRequested(true);
		}

		dispatch(mountActions.unpark());
		dispatch(mountActions.gotoTarget(target.info.name));
	};

	// Sets the target information when Schedule is clicked
	const schedule = () =>
	{
		dispatch(
			targetsActions.setSelectedTarget({
				name: target.info.name,
				ra0: target.info.ra0,
				de0: target.info.de0,
			}),
		);

		// Get selected FOV profile in order to get position angle
		const state = store.getState();
		let pa = null;
		const currentFOVProfile = state.targets.currentFOVProfile;
		const fovProfiles = state.targets.fovProfiles;
		const activeProfile = fovProfiles.find(
			(oneFOV) => oneFOV.name === currentFOVProfile,
		);
		if (!isEmpty(activeProfile)) pa = activeProfile.pa;

		if (pa !== null)
		{
			dispatch(schedulerActions.updateSchedulerSettings({ pa: pa }));
		}

		dispatch({
			type: commands.NEW_NOTIFICATION,
			payload: {
				severity: 1,
				uuid: "",
				message: target.info.name + " added to Scheduler.",
			},
		});
	};
	/**
	 * Check if mount completed slewing to target.
	 */
	useEffect(() =>
	{
		if (isSameTarget(mountTarget, target.info) && mountStatus === "Tracking")
		{
			if ((slewRequested || goRequested) && mountStatus === "Tracking")
			{
				setBorderColor(Palette.green);
				setSlewRequested(false);
			}
			else if (goRequested)
			{
				// Slew To Target solving after 1 second.
				setTimeout(() =>
				{
					// Double check everything is OK before proceeding
					if (
						mountStatus === "Tracking" &&
						isSameTarget(mountTarget, target.info)
					)
					{
						setGoRequested(false);
						setSolveRequested(true);
						setTimeout(() => solve(1), 1000);
					}
				}, 1500);
			}
		}
	}, [mountStatus, slewRequested, goRequested, mountTarget]);

	if (!(target && target.info)) return null;

	return (
		<Unstable_Grid2
			sx={[
				styles.row,
				{
					width: "100%",
					display: "grid",
					gridTemplateColumns: "160px 200px 1fr 152px",
					border: `1px solid ${borderColor}`,
					borderRadius: "5px",
					alignItems: "center",
					padding: "6px",
					gap: "10px",
				},
			]}
		>
			<Unstable_Grid2
				id="objectInfo"
				xl={2}
				lg={2}
				sx={[LOCAL_STYLES.objectHeaderContainer]}
			>
				{!isEmpty(target.info.designations) && (
					<Typography
						sx={[
							LOCAL_STYLES.objectHeader,
							{
								fontSize: "14px",
								color: Palette.white70,
								width: "min-content",
								minWidth: "120px",
								textAlign: "center",
							},
						]}
					>
						{target.info.designations.join(", ")}
					</Typography>
				)}

				<Box
					sx={[
						styles.row,
						styles.center,
						{ justifyContent: "space-evenly", gap: "4px" },
					]}
				>
					<Typography
						sx={[
							styles.center,
							{
								fontSize: "10px",
								textAlign: "center",
								lineHeight: 1.5,
								color: Palette.white70,
							},
						]}
					>
						{target.info.name}
					</Typography>

					{!isEmpty(observability) ? (
						<Box>
							{hourAngle < -1 ? (
								<Icon name="north-east" color="green" size={26} />
							) : null}
							{hourAngle > 1 ? (
								<Icon name="south-east" color="red" size={26} />
							) : null}
							{hourAngle >= -1 && hourAngle <= 1 ? (
								<Icon name="east" color="yellow" size={24} />
							) : null}
						</Box>
					) : null}

					{target.info.magnitude ? (
						<Box
							sx={{
								alignSelf: "center",
								justifyContent: "center",
								alignItems: "center",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<Icon name="flare" size={22} color="#ffffffcc" />
							<Typography
								sx={{
									fontSize: "14px",
									textAlign: "center",
									textAlignVertical: "center",
									color: Palette.white70,
								}}
							>
								{target.info.magnitude.toFixed(1)}
							</Typography>
						</Box>
					) : null}
				</Box>

				{/* Object information Direction, Magnitude and rise/set times */}
				{rise ? (
					<Box
						sx={[
							styles.row,
							styles.center,
							{ justifyContent: "space-around", gap: "10px" },
						]}
					>
						<Box sx={[LOCAL_STYLES.riseContainer]}>
							<Icon name="north-east" size={20} color="#ffffffcc" />
							{/* Display icon if circumpolar, NA if never rises, and the time otherwise */}
							{rise.rise === "Circumpolar" ? (
								<Circumpolar style={{ width: 30, height: 30 }} />
							) : rise.rise === "Never rises" ? (
								<Typography style={LOCAL_STYLES.riseText}>NA</Typography>
							) : (
								<Typography style={LOCAL_STYLES.riseText}>
									{rise.rise}
								</Typography>
							)}
						</Box>

						<Box sx={[LOCAL_STYLES.riseContainer]}>
							<Icon name="east" size={20} color="#ffffffcc" />
							<Typography sx={LOCAL_STYLES.riseText}>{rise.transit}</Typography>
						</Box>

						<Box sx={[LOCAL_STYLES.riseContainer]}>
							<Icon name="south-east" size={20} color="#ffffffcc" />
							{/* Display icon if circumpolar, NA if never rises, and the time otherwise */}
							{rise.set === "Circumpolar" ? (
								<Circumpolar style={{ width: 30, height: 30 }} />
							) : rise.set === "Never rises" ? (
								<Typography sx={LOCAL_STYLES.riseText}>NA</Typography>
							) : (
								<Typography sx={LOCAL_STYLES.riseText}>{rise.set}</Typography>
							)}
						</Box>
					</Box>
				) : null}
			</Unstable_Grid2>

			{/* Object Image */}
			{get(imageSource, "uri", false) ? (
				<Unstable_Grid2 id="targetFOV" xl={2} lg={2} md={6}>
					<TargetImage
						preview={preview}
						imageSource={imageSource}
						targetInfo={target.info}
						solve={solve}
					/>
				</Unstable_Grid2>
			) : null}

			{/* Altitude vs Time plot */}
			<Unstable_Grid2 sx={{ flexGrow: 1 }}>
				<TargetPlot
					almanac={almanac}
					rise={rise}
					datetime={datetime}
					observability={observability}
				/>
			</Unstable_Grid2>

			{/* Object buttons like go to and favorite and add to a list*/}
			<Unstable_Grid2
				id="targetAction"
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					columnGap: "8px",
					rowGap: "12px",
					width: "fit-content",
				}}
			>
				<Button sx={LOCAL_STYLES.btn} onClick={() => toggleFavorites(target)}>
					<Icon
						name="favorite"
						color={isFavorite ? "red" : Palette.white70}
						size={25}
					/>
				</Button>
				<Button
					disabled={isArray(lists) && lists.length <= 1}
					sx={LOCAL_STYLES.btn}
					onClick={() =>
					{
						if (isArray(lists) && lists.length > 1)
							setListsPopup({ show: true, target: target });
					}}
				>
					<Icon color={Palette.white70} name="add" size={25} />
				</Button>
				<Button
					sx={LOCAL_STYLES.btn}
					onClick={() => addToList(activeList, target)}
					disabled={isEmpty(activeList)}
				>
					<Icon color={Palette.white70} name="remove" size={25} />
				</Button>

				<Button disabled={!ekosRunning} onClick={slew} style={LOCAL_STYLES.btn}>
					<Icon color={Palette.white70} name="gps-fixed" size={25} />
				</Button>
				<Button
					onClick={!ekosRunning ? schedule : isBusy ? abort : go}
					sx={[
						LOCAL_STYLES.btn,
						{
							gridColumn: "2 / 4",
							color: Palette.white70,
							fontSize: "16px",
							textAlign: "center",
							width: "98px",
							whiteSpace: "nowrap",
						},
					]}
				>
					{!ekosRunning
						? "Schedule"
						: isBusy
							? s.general.stop
							: s.targets.go_and_solve}
				</Button>
			</Unstable_Grid2>
		</Unstable_Grid2>
	);
};

const LOCAL_STYLES = {
	objectHeaderContainer: {
		display: "grid",
		placeItems: "center",
		boxSizing: "content-box",
		border: "1px solid green",
		padding: "10px",
		gap: "5px",
	},
	objectHeader: {
		display: "grid",
		placeItems: "center",
		boxSizing: "content-box",
		border: "1px solid green",
		padding: "5px 10px",
		borderRadius: "5px",
		backgroundColor: "#356038",
		maxWidth: "180px",
	},
	riseText: {
		fontSize: "14px",
		textAlign: "center",
		textAlignVertical: "center",
		color: Palette.white70,
	},
	riseContainer: {
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		gap: "2px",
	},
	btn: {
		height: "45px",
		width: "45px",
		backgroundColor: Palette.grey44,
		minWidth: "auto",
	},
};

export default memo(TargetRow, isEqual);
