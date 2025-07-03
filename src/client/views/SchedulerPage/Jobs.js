import React, { memo, useEffect, useState } from "react";
import { get, isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Typography } from "@mui/material";
import { ekosActions, schedulerActions } from "@redux/actions";
import {
	selectJobs,
	selectCaptureStatus,
	selectSeqr,
	selectSeqv,
	selectUser,
	selectTrainDeviceName,
} from "@redux/selectors";
import {
	DEVICE_TYPE,
	ekosFileManager,
	MetaType,
	planType,
	SchedulerJobStatus,
	trainModules,
} from "@indi/enums";
import { styles } from "../../shared/styles";
import Icon from "../../Components/Icon";
import LinearProgress from "../../Components/LinearProgress";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import {
	removeWhiteSpace,
	returnSchedulerStatus,
} from "@common/shared/common/common";
import ChecklistRtlIcon from "@mui/icons-material/ChecklistRtl";
import TimerIcon from "@mui/icons-material/Timer";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DirectoryBrowser from "@components/DirectoryBrowser";
import SaveSequence from "./SaveSequence";
import { toast } from "react-toastify";
import { ekosliveServer } from "@client/config";

const SchedulerText = ({ title, styles = {} }) =>
{
	return (
		<Typography sx={{ color: "white", width: "max-content", ...styles }}>
			{title}
		</Typography>
	);
};

const Status = (props) => (
	<Box sx={LOCAL_STYLES.statusBox}>
		<ChecklistRtlIcon sx={{ color: Palette.white70 }} />
		<Typography sx={LOCAL_STYLES.sequencesInfo}>
			{get(props, "status", "--")}
		</Typography>
	</Box>
);

const NameInfo = (props) =>
{
	// displays the first three letters of the filter
	return (
		<Box sx={LOCAL_STYLES.statusBox}>
			<Icon name="fits" color={Palette.white70} />
			<Typography sx={LOCAL_STYLES.sequencesInfo}>
				{get(props, "name", "--")}
			</Typography>
		</Box>
	);
};

const AltitudeInfo = (props) =>
{
	return (
		<Box sx={LOCAL_STYLES.statusBox}>
			<Icon name="height" color={Palette.white70} />
			<Typography sx={LOCAL_STYLES.sequencesInfo}>
				{get(props, "altitude", 0)}
			</Typography>
		</Box>
	);
};

const StartTime = (props) =>
{
	// displays the first three letters of the filter
	return (
		<Box>
			<TimerIcon sx={{ color: Palette.white70 }} />
			<Typography sx={[LOCAL_STYLES.sequencesInfo, { marginRight: "15px" }]}>
				{get(props, "time", "--")}
			</Typography>
		</Box>
	);
};

const EndTime = (props) =>
{
	return (
		<Box sx={LOCAL_STYLES.statusBox}>
			<TimerOffIcon sx={{ color: Palette.white70 }} />
			<Typography sx={[LOCAL_STYLES.sequencesInfo, { width: "150px" }]}>
				{get(props, "time", "--")}
			</Typography>
		</Box>
	);
};

const Jobs = ({ setSchedulerSetings }) =>
{
	const dispatch = useDispatch();

	const sequences = useSelector(selectJobs);
	const status = useSelector(selectCaptureStatus);
	const seqr = useSelector(selectSeqr);
	const seqv = useSelector(selectSeqv);
	const defaultDir = useSelector((state) =>
		get(state.ekos.files, "default", ""),
	);
	const activeCameraName = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);
	const isDirExist = useSelector((state) =>
		get(state.ekos.files, "exists.result", ""),
	);

	const file = useSelector((state) => state.ekos.saveJobFile);
	const [filename, setFilename] = useState("");
	const [directory, setDirectory] = useState("");
	const user = useSelector(selectUser);
	const homeDir = useSelector((state) => state.setup.homeDirectory);

	const isCapturing =
		status !== "Idle" && status !== "Aborted" && status !== "Complete";

	//To-Do update the Progress
	const [sequencePercentage, setSequencePercentage] = useState();
	const [showSaveModal, setShowSaveModal] = useState(false);
	const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(false);

	const editJob = (index) =>
	{
		dispatch(
			ekosActions.invokeMethod("Scheduler", "modifyJob", [
				{ type: MetaType.Int, value: index },
			]),
		);
		setSchedulerSetings(index);
	};

	const loadSequence = async (filename) =>
	{
		try
		{
			dispatch(
				ekosActions.invokeMethod("SchedulerProcess", "loadScheduler", [
					{
						type: MetaType.String,
						value: filename,
					},
				]),
			);
		}
		catch (err)
		{
			console.log(err);
		}
	};

	const saveJob = async (filename) =>
	{
		try
		{
			const cameraName = isEmpty(activeCameraName)
				? "unknown"
				: removeWhiteSpace(activeCameraName);
			const directory = homeDir + "/Documents/scheduler/" + cameraName;
			const filePath = `file://${directory}/${filename}.esl`;

			dispatch(
				ekosActions.fileDirectoryOperation({
					path: directory,
					operation: ekosFileManager.EXISTS,
				}),
			);
			if (!isDirExist)
			{
				dispatch(
					ekosActions.fileDirectoryOperation({
						path: directory,
						operation: ekosFileManager.CREATE,
					}),
				);
			}
			dispatch(
				ekosActions.invokeMethod("SchedulerProcess", "saveScheduler", [
					{ type: MetaType.Url, value: filePath },
				]),
			);
			dispatch(ekosActions.saveJob(directory, filePath));
			setDirectory(directory);

			setFilename(filename);
			toast.success(s.general.success);

			setShowSaveModal(false);
		}
		catch (error)
		{
			console.log("error: ", error);
		}
	};

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	useEffectAsync(async () =>
	{
		if (!isEmpty(file) && !isEmpty(filename))
		{
			if (user && user.plan_id !== planType.DEFAULT)
			{
				const formData = new FormData();
				const blobFile = new Blob([file], { type: "application/esl" });
				formData.append("file", blobFile);
				formData.append("filename", `${filename}.esl`);
				formData.append("username", user.username);
				formData.append("path", directory);
				formData.append("token", user.token);
				await ekosliveServer.post("/api/cloud/scheduler", formData, {
					headers: {
						"Content-Type": "multipart/form-data",
					},
				});
			}
		}
	}, [file]);

	useEffect(() =>
	{
		if (sequencePercentage !== (seqv / seqr) * 100.0)
			setSequencePercentage((seqv / seqr) * 100.0);
	}, [seqv, seqr]);

	//Setting sequence percentage according to the status
	useEffect(() =>
	{
		setSequencePercentage((seqv / seqr) * 100);
	}, [status]);

	return (
		<Box sx={{ flex: 1, height: 400 }}>
			<SchedulerText title={s.general.jobs} styles={{ margin: "0 auto" }} />

			<Box
				sx={{
					display: "flex",
					gap: "4px",
					alignItems: "center",
					justifyContent: "center",
					marginTop: "10px",
				}}
			>
				<IconButton
					disabled={isEmpty(sequences)}
					onClick={() => setShowSaveModal(true)}
					sx={[LOCAL_STYLES.imageButton]}
				>
					<SaveIcon sx={{ color: "#FFFFFF", fontSize: 25 }} />
				</IconButton>

				<IconButton
					onClick={() => setShowDirectoryBrowser(true)}
					sx={[LOCAL_STYLES.imageButton]}
				>
					<UploadFileIcon sx={{ color: Palette.white, fontSize: 25 }} />
				</IconButton>
			</Box>
			<Box sx={{ width: "100%", overflow: "auto", height: "450px" }}>
				{sequences && Array.isArray(sequences) && sequences.length > 0 ? (
					sequences.map((item, index) =>
						{
						const key = item?.targetDEC + item?.targetRA + item.name + index;
						return (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									marginTop: "24px",
								}}
								key={key}
							>
								<Box sx={[styles.row, { justifyContent: "space-between" }]}>
									<Typography sx={Palette.white}>{index + 1} </Typography>
									<Box>
										<Icon
											color={Palette.white}
											onClick={() => editJob(index)}
											name="edit"
										/>
										<Icon
											color={Palette.white}
											onClick={() =>
												{
												dispatch(schedulerActions.removeJob({ index }));
												dispatch(schedulerActions.getJobs());
											}}
											name="Close"
										/>
									</Box>
								</Box>
								<Box
									sx={{ display: "flex", flexDirection: "row", width: "100%" }}
								>
									<Box sx={[{ paddingTop: "6px", width: "100%" }]}>
										{item.state === 7 ? (
											<LinearProgress color="success" progress={100} />
										) : (
											<LinearProgress
												color="warning"
												progress={
													!isCapturing
														? 0
														: item.state === 3
															? sequencePercentage
															: 0
												}
											/>
										)}
									</Box>
									<Box
										sx={{
											display: "flex",
											justifyContent: "flex-end",
											paddingLeft: "10px",
										}}
									>
										{item.state !== SchedulerJobStatus.IDLE &&
										item.state !== SchedulerJobStatus.COMPLETED ? (
											<Typography sx={[styles.text, { fontSize: "12px" }]}>
												{seqv}/{seqr}
											</Typography>
										) : (
											<Typography sx={[styles.text, { fontSize: "12px" }]}>
												{item.state === SchedulerJobStatus.COMPLETED
													? item.completedCount + "/" + item.sequenceCount
													: item.sequenceCount}
											</Typography>
										)}
									</Box>
								</Box>
								<Box
									sx={[
										styles.row,
										{
											paddingVertical: "5px",
										},
									]}
								>
									<NameInfo name={item.name} />
									<Status status={returnSchedulerStatus(item.state)} />
									{/*<Score score={item.score}/>*/}
									<AltitudeInfo altitude={item.altitudeFormatted} />

									{!isEmpty(item.startupFormatted) && (
										<StartTime time={item.startupFormatted} />
									)}
									{!isEmpty(item.endFormatted) && (
										<EndTime time={item.endFormatted} />
									)}
								</Box>
							</Box>
						);
					})
				) : (
					<Typography
						sx={[
							{ color: Palette.white, textAlign: "center", marginTop: "10px" },
						]}
					>
						{s.ekos.scheduler.no_jobs}
					</Typography>
				)}
				{/* /////////////////////////////////////////////////////////////// */}
			</Box>
			{showSaveModal && (
				<SaveSequence
					saveJob={saveJob}
					filename={filename}
					setFilename={(e) => setFilename(e)}
					close={() => setShowSaveModal(false)}
				/>
			)}
			{showDirectoryBrowser && (
				<DirectoryBrowser
					toggle={() => setShowDirectoryBrowser(false)}
					fileExtension="esl"
					dir={defaultDir + "/scheduler"}
					show={showDirectoryBrowser}
					selection={loadSequence}
					isFile
				/>
			)}
		</Box>
	);
};

export default memo(Jobs);

const LOCAL_STYLES = {
	sequencesInfo: {
		width: "100px",
		// padding: "12px",
		fontSize: "12px",
		borderBottomWidth: 1,
		borderBottomColor: Palette.white20,
	},
	statusBox: {
		width: "75px",
		alignItems: "center",
	},
	imageButton: {
		width: "40px",
		height: "40px",
		minWidth: "auto",
		padding: 0,
		borderRadius: "4px",
		backgroundColor: "#FFFCFA1A",
	},
};
