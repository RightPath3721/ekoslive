import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material";
import Image from "mui-image";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
	getAchievementInfo,
	getEchoData,
	getTotalImages,
	getTotalMessiers,
	selectUser,
	selectMountStatus,
	selectMountTarget,
	selectCaptureStatus,
	selectSeqr,
	selectSeqv,
	selectCaptureMetadata,
	selectWsMediaLiveStacking,
} from "@redux/selectors";
import dayjs from "dayjs";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import isEmpty from "lodash/isEmpty";
import { captureException } from "@sentry/browser";
import { achievementActions } from "@redux/actions/achievements.actions";
import { achievementsConstants, ekosConstants } from "@redux/constants";
import s from "@common/shared/i18n/i18n";
import { ekosliveServer } from "../config";
import achievementsInfo from "@common/shared/common/achievements";
import { styles } from "@client/shared/styles";
import achievementBackgroundImg from "@images/achievement.webp";
import badges from "@common/shared/common/badges";
import { removeWhiteSpace } from "@common/shared/common/common";
import { v4 as uuidv4 } from "uuid";

const AnimationListener = () =>
{
	const dispatch = useDispatch();
	const { palette } = useTheme();

	const achievements = useSelector(getAchievementInfo, isEqual);
	const metadata = useSelector(selectCaptureMetadata, isEqual);
	const liveStacking = useSelector(selectWsMediaLiveStacking, isEqual);
	const mountStatus = useSelector(selectMountStatus);
	const mountTarget = useSelector(selectMountTarget);
	const status = useSelector(selectCaptureStatus);
	const seqr = useSelector(selectSeqr);
	const seqv = useSelector(selectSeqv);
	const echo = useSelector(getEchoData, isEqual);
	const totalImages = useSelector(getTotalImages, isEqual);
	const totalMessiers = useSelector(getTotalMessiers, isEqual);
	const presets = useSelector((state) => state.presets);
	const [active, setActive] = useState(false);
	const [achievementImage, setAchievementImage] = useState("");
	const user = useSelector(selectUser);

	const returnPayload = (type) =>
	{
		let payload;
		const key = removeWhiteSpace(mountTarget?.toLowerCase());

		achievementsInfo.map((achievement) =>
		{
			if (achievement.type === type)
			{
				if (achievement.type === achievementsConstants.ALL_MESSIER_CAPTURED)
				{
					if (achievement.key === key) payload = achievement;
				}
				else payload = achievement;
			}
		});
		return payload;
	};

	const countImageStatistics = () =>
	{
		if (
			[
				achievementsConstants.TEN_SEQUENCES_ACHIEVED,
				achievementsConstants.CAPTURE_PREVIEW_ACHIEVED,
				achievementsConstants.FILTER_CAPTURE_IMAGE,
			].includes(echo.type)
		)
		{
			dispatch(achievementActions.updateTotalImages(totalImages + 1));
			if (
				!isEmpty(mountTarget) &&
				mountTarget.startsWith("M ") &&
				!isEmpty(metadata)
			)
			{
				if (get(achievements, "capture_messier.status", false) === false)
				{
					setAchievement(achievementsConstants.CAPTURE_MESSIER_ACHIEVED);
				}

				if (
					get(achievements, "all_messiers.status", false) === false &&
					totalMessiers.length >= 110
				)
				{
					setAchievement(achievementsConstants.ALL_MESSIER_CAPTURED);
				}

				if (
					!totalMessiers.includes(mountTarget) &&
					mountStatus !== "Slewing" &&
					!isEqual(metadata, false)
				)
				{
					dispatch(
						achievementActions.updateTotalMessiers([
							...totalMessiers,
							mountTarget,
						]),
					);
					setAchievement(achievementsConstants.ALL_MESSIER_CAPTURED);
				}
			}

			if (
				!isEmpty(metadata) &&
				get(achievements, "filtered_image.status", false) === false
			)
			{
				const previewPreset = get(presets, "previewPreset.filter", "");
				const capturePreset = get(presets, "capturePresets", false);
				const currentCapturePreset = get(
					presets,
					"capturePresets.currentCapturePreset",
					"Default",
				);
				let checkCapturePresets = false;

				if (capturePreset)
				{
					capturePreset.map((onePreset) =>
					{
						if (onePreset === currentCapturePreset && onePreset !== "Default")
						{
							let filter = get(onePreset, "filter", "");
							if (["OIII", "H_Alpha", "SII"].includes(filter))
								checkCapturePresets = true;
						}
					});
				}

				if (
					["OIII", "H_Alpha", "SII"].includes(previewPreset) ||
					checkCapturePresets
				)
				{
					setAchievement(achievementsConstants.FILTER_CAPTURE_IMAGE);
				}
			}

			if (
				!isEmpty(metadata) &&
				totalImages === 500 &&
				get(achievements, "capture_master.status", false) === false
			)
			{
				setAchievement(achievementsConstants.CAPTURE_SKY_MASTER);
			}

			if (
				!isEmpty(metadata) &&
				totalImages === 1000 &&
				get(achievements, "capture_legend.status", false) === false
			)
			{
				setAchievement(achievementsConstants.CAPTURE_SKY_LEGEND);
			}
		}
	};
	const setAchievement = (type) =>
	{
		const payload = returnPayload(type);
		if (!isEmpty(payload))
		{
			dispatch(
				achievementActions.setAchievement({
					...payload,
					ts: +new Date(),
					createdAt: +new Date(),
					status: true,
					uuid: uuidv4(),
					name: payload.key,
				}),
			);
			startAnimation();
		}
	};

	const checkForAnimation = () =>
	{
		switch (get(echo, "type", "")) {
			case achievementsConstants.CAPTURE_PREVIEW_ACHIEVED:
				if (
					get(achievements, "capture_preview.status", false) === false &&
					!isEmpty(metadata)
				)
					setAchievement(achievementsConstants.CAPTURE_PREVIEW_ACHIEVED);
				countImageStatistics();
				break;

			case achievementsConstants.TEN_SEQUENCES_ACHIEVED:
				if (
					get(achievements, "ten_sequences.status", false) === false &&
					seqr === 10 &&
					seqv === 10
				)
					setAchievement(achievementsConstants.TEN_SEQUENCES_ACHIEVED);
				countImageStatistics();
				break;

			case achievementsConstants.MOUNT_GOTO_ACHIEVED:
				if (get(achievements, "mount_goto.status", false) === false)
					setAchievement(achievementsConstants.MOUNT_GOTO_ACHIEVED);
				break;

			case achievementsConstants.VIDEO_RECORDING_ACHIEVED:
				if (
					get(achievements, "video_recording.status", false) === false &&
					status === "Streaming"
				)
					setTimeout(
						() =>
							setAchievement(achievementsConstants.VIDEO_RECORDING_ACHIEVED),
						60000,
					);
				break;

			case achievementsConstants.WEATHER_CHECK_ACHIEVED:
				if (
					get(achievements, "weather_check.status", false) === false &&
					get(echo, "payload", 0) >= 8
				)
					setAchievement(achievementsConstants.WEATHER_CHECK_ACHIEVED);
				break;

			case achievementsConstants.LIVE_STACK_ACHIEVED:
				if (
					get(achievements, "live_stacking.status", false) === false &&
					!isEmpty(liveStacking) &&
					get(liveStacking, "length", 0) >= 5
				)
					setAchievement(achievementsConstants.LIVE_STACK_ACHIEVED);
				break;

			case achievementsConstants.CREATE_DARKS_ACHIEVED:
				if (
					get(achievements, "create_darks.status", false) === false &&
					get(echo, "payload.totalImages", 0) === 50
				)
					setAchievement(achievementsConstants.CREATE_DARKS_ACHIEVED);
				break;

			case achievementsConstants.CREATE_DEFECT_ACHIEVED:
				if (
					get(achievements, "create_defects.status", false) === false &&
					get(echo, "payload.hotSpin", 0) >= 80 &&
					get(echo, "payload.coldSpin", 0) >= 80
				)
					setAchievement(achievementsConstants.CREATE_DEFECT_ACHIEVED);
				break;

			case achievementsConstants.IMPORT_MOSAIC_ACHIEVED:
				if (get(achievements, "import_mosaic.status", false) === false)
					setAchievement(achievementsConstants.IMPORT_MOSAIC_ACHIEVED);
				break;

			case achievementsConstants.POLAR_ALIGNMENT_BOX: {
				const arcsecs = get(echo, "payload.arcsecs", {});
				if (
					get(achievements, "paa_arcsec.status", false) === false &&
					arcsecs < 30
				)
					setAchievement(achievementsConstants.POLAR_ALIGNMENT_BOX);
				break;
			}
			case achievementsConstants.ACHIEVE_GUIDE_RMS: {
				const arcsecs = get(echo, "payload.totalRMS", {});
				if (
					get(achievements, "guide_rms.status", false) === false &&
					arcsecs < 0.5
				)
					setAchievement(achievementsConstants.ACHIEVE_GUIDE_RMS);
				break;
			}

			case achievementsConstants.DOWNLOAD_GALLERY_IMAGE: {
				if (get(achievements, "gallery_image.status", false) === false)
					setAchievement(achievementsConstants.DOWNLOAD_GALLERY_IMAGE);
				break;
			}

			case achievementsConstants.EXPLORER: {
				if (get(achievements, "explorer.status", false) === false)
				{
					setAchievement(achievementsConstants.EXPLORER);
					dispatch({ type: ekosConstants.RESET_ECHO_DATA, payload: {} });
				}
				break;
			}
		}
	};

	const startAnimation = () =>
	{
		if (!achievements.recentAchievement !== "none")
		{
			setActive(true);
			setTimeout(() =>
			{
				setActive(false);
				setAchievementImage("");
			}, 6000);
		}
	};

	const loadAchievementImage = async () =>
	{
		try
		{
			for (let item of achievementsInfo)
			{
				if (
					achievements[item.key]?.title &&
					achievements.recentActivity?.title &&
					achievements[item.key].title === achievements.recentActivity.title
				)
				{
					const image = await import(
						`@images/${get(badges, item.key, "badges/first_light")}.webp`
					);
					setAchievementImage(image.default);

					return;
				}
			}

			await import(`@images/badges/first_light.webp`).then((image) =>
				setAchievementImage(image.default),
			);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() =>
	{
		checkForAnimation();
		loadAchievementImage();
	}, [echo, metadata, status]);

	if (!active) return null;

	return (
		<Stack
			sx={[
				styles.center,
				{
					position: "absolute",
					top: "10%",
					left: "50%",
					transform: "translateX(-50%)",
					zIndex: 100,
					animation: "fadeInOut 6s",
				},
			]}
		>
			<Image
				src={achievementBackgroundImg}
				alt="Shining sky with stars"
				fit="contain"
				height="300px"
				width="100%"
			/>

			{achievementImage && (
				<Image
					src={achievementImage}
					alt="Achievement badge"
					wrapperStyle={{
						position: "absolute",
						left: "50%",
						top: "5%",
						transform: "translateX(-50%)",
						height: "130px",
						width: "130px",
						borderRadius: "50%",
						overflow: "hidden",
						border: `4px solid ${palette.primary.main}`,
					}}
				/>
			)}

			<Typography
				textAlign="center"
				sx={{
					position: "absolute",
					top: "50%",
					right: "14%",
					fontSize: "2.375rem",
				}}
				fontWeight={700}
			>
				{get(achievements, "recentActivity.points", 0)}
			</Typography>

			<Box
				sx={{
					position: "absolute",
					top: "57%",
					width: "100%",
					textAlign: "center",
				}}
			>
				<Typography component="p" variant="h2">
					{s.achievements.unlocked}
				</Typography>
				<Typography
					fontWeight={500}
					component="h3"
					variant="h1"
					sx={{
						marginTop: "1.25rem",
					}}
					color="primary"
				>
					{get(achievements, "recentActivity.title", "")}
				</Typography>
			</Box>
		</Stack>
	);
};

export default AnimationListener;
