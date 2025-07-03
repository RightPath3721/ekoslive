import React, { useEffect, useState } from "react";
import { get, isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { Box, IconButton, Typography } from "@mui/material";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { captureActions, ekosActions } from "@redux/actions";
import { removeWhiteSpace } from "@common/shared/common/common";
import { styles } from "../../shared/styles";
import Icon from "../../Components/Icon";
import LinearProgress from "../../Components/LinearProgress";
import s from "@common/shared/i18n/i18n";
import DirectoryBrowser from "../../Components/DirectoryBrowser";
import SaveSequence from "./SaveSequence";
import {
	trainModules,
	DEVICE_TYPE,
	ekosFileManager,
	planType,
} from "@indi/enums";
import {
	selectSequences,
	selectSeqr,
	selectSeqv,
	selectUser,
	selectTrainDeviceName,
} from "@redux/selectors";
import { Palette } from "@common/shared/common/styles";
import { toast } from "react-toastify";
import { ekosliveServer } from "@client/config";

const FilterIcon = ({ filter }) =>
{
	// displays the first three letters of the filter
	return (
		<Box
			sx={[
				LOCAL_STYLES.circle_hollow,
				styles.center,
				{ border: "1px solid white" },
			]}
		>
			<Typography sx={[{ fontSize: "10px", color: "white" }]}>
				{filter.slice(0, 3)}
			</Typography>
		</Box>
	);
};

const ExpIcon = ({ exp }) =>
{
	return (
		<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
			<Typography sx={[styles.text, { fontSize: "10px" }]}>
				{parseInt(exp)}s
			</Typography>
		</Box>
	);
};

const OffsetIcon = ({ offset }) =>
{
	return (
		<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
			<Typography sx={[styles.text, { fontSize: "10px" }]}>{offset}</Typography>
		</Box>
	);
};

const FrameTypeIcon = ({ type }) =>
{
	if (type === "Light")
		return (
			<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
				<Typography sx={[styles.text, { fontSize: "10px" }]}>L</Typography>
			</Box>
		);
	else if (type === "Bias")
		return (
			<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
				<Typography sx={[styles.text, { fontSize: "10px" }]}>B</Typography>
			</Box>
		);
	else if (type === "Dark")
		return (
			<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
				<Typography sx={[styles.text, { fontSize: "10px" }]}>D</Typography>
			</Box>
		);
	else if (type === "Flat")
		return (
			<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
				<Typography sx={[styles.text, { fontSize: "10px" }]}>F</Typography>
			</Box>
		);
	else if (type === "Dark Flat")
		return (
			<Box sx={[LOCAL_STYLES.square_hollow, styles.center]}>
				<Typography sx={[styles.text, { fontSize: "10px" }]}>DF</Typography>
			</Box>
		);
};

const BinIcon = ({ bin }) =>
{
	return (
		<Box sx={[LOCAL_STYLES.rectangle_hollow, styles.text, styles.center]}>
			<Typography sx={{ fontSize: "10px" }}>{bin}</Typography>
		</Box>
	);
};

const Sequence = ({ setPreset }) =>
{
	const dispatch = useDispatch();
	const sequences = useSelector(selectSequences);
	const user = useSelector(selectUser);
	const file = useSelector((state) => state.ekos.saveSequenceFile);
	const seqr = useSelector(selectSeqr);
	const seqv = useSelector(selectSeqv);
	const defaultDir = useSelector((state) =>
		get(state.ekos.files, "default", ""),
	);
	const isDirExist = useSelector((state) =>
		get(state.ekos.files, "exists.result", ""),
	);
	const activeCameraName = useSelector((state) =>
		selectTrainDeviceName(state, {
			trainType: trainModules.CaptureOpticalTrain,
			deviceType: DEVICE_TYPE.CAMERA,
		}),
	);

	const [selectFileName, setSelectFileName] = useState(false);
	const [sequencePercentage, setSequencePercentage] = useState(0);
	const [filename, setFilename] = useState("");
	const [directory, setDirectory] = useState("");
	const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(false);

	const saveSequence = async (filename) =>
	{
		try
		{
			const directory =
				defaultDir +
				"/sequences/" +
				removeWhiteSpace(activeCameraName || "unnamed");
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

			const filepath = directory + "/" + filename + ".esq";
			setDirectory(directory);
			setFilename(filename);
			dispatch(captureActions.saveSequenceFile(filepath));

			// Upload to AWS, If user is PRO
		}
		catch (err)
		{
			console.log(err);
		}
	};

	const loadSequence = async (filename) =>
	{
		try
		{
			dispatch(captureActions.loadSequenceFile(filename));
		}
		catch (err)
		{
			console.log(err);
		}
	};

	const useEffectAsync = (effect, inputs) =>
	{
		useEffect(() =>
		{
			effect();
		}, inputs);
	};

	useEffect(() =>
	{
		if (sequencePercentage !== (seqv / seqr) * 100.0)
			setSequencePercentage((seqv / seqr) * 100.0);
	}, [seqv, seqr]);

	useEffectAsync(async () =>
	{
		if (!isEmpty(file))
		{
			if (user && user.plan_id !== planType.DEFAULT)
			{
				try
				{
					const formData = new FormData();
					const blobFile = new Blob([file], { type: "application/esq" });
					formData.append("file", blobFile);
					formData.append("filename", `${filename}.esq`);
					formData.append("path", directory);
					formData.append("username", user.username);
					formData.append("token", user.token);

					await ekosliveServer.post(`/api/cloud/sequences`, formData, {
						headers: {
							"Content-Type": "multipart/form-data",
						},
					});
					toast.success(s.general.success);
				}
				catch (error)
				{
					console.log("Capture saveSequence error: ", error);
				}
			}
		}
	}, [file]);

	return (
		<Box
			sx={{
				flex: 1,
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				alignItems: "center",
			}}
		>
			<Typography
				sx={{
					textTransform: "capitalize",
					color: "white",
					display: "flex",
					justifyContent: "center",
				}}
			>
				{s.ekos.collapse_sequence.sequences}
			</Typography>

			<Box
				sx={{
					display: "flex",
					gap: "4px",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<IconButton
					disabled={isEmpty(sequences)}
					onClick={() => setSelectFileName(!selectFileName)}
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

				<IconButton
					disabled={isEmpty(sequences)}
					onClick={() => dispatch(captureActions.clearSequences())}
					sx={[LOCAL_STYLES.imageButton]}
				>
					<DeleteSweepIcon sx={{ color: "#FFFFFF", fontSize: 25 }} />
				</IconButton>
			</Box>

			<Box sx={{ width: "100%", overflow: "auto", height: "450px" }}>
				{sequences && Array.isArray(sequences) && sequences.length > 0 ? (
					sequences.map((item, index) =>
						{
						return (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									marginTop: "24px",
								}}
								key={index}
							>
								<Box sx={[styles.row, { justifyContent: "space-between" }]}>
									<Typography sx={{ color: "white" }}>{index + 1} </Typography>
									<Box sx={styles.row}>
										<Icon
											color={Palette.white}
											onClick={() => setPreset(index)}
											name="edit"
										/>
										<Icon
											color={Palette.white}
											onClick={() =>
												dispatch(captureActions.removeSequence(index))
											}
											name="Close"
										/>
									</Box>
								</Box>

								{item.Status === "Complete" ? (
									<LinearProgress color="success" progress={100} />
								) : (
									<LinearProgress
										color="warning"
										progress={item.Status === "Idle" ? 0 : sequencePercentage}
									/>
								)}

								{item.Status !== "Idle" && item.Status !== "Complete" ? (
									<Typography sx={[styles.text, { fontSize: "12px" }]}>
										{seqv}/{seqr}
									</Typography>
								) : (
									<Typography sx={[styles.text, { fontSize: "12px" }]}>
										{item.Status === "Complete"
											? item.Count.slice(2) + "/" + item.Count.slice(2)
											: item.Count}
									</Typography>
								)}

								<Box sx={[styles.row, { gap: "12px" }]}>
									<FilterIcon filter={item.Filter} />
									<FrameTypeIcon type={item.Type} />
									<BinIcon bin={item.Bin} />
									<ExpIcon exp={item.Exp} />
									<OffsetIcon offset={item.Offset} />
								</Box>
							</Box>
						);
					})
				) : (
					<Typography sx={[{ color: "white", textAlign: "center" }]}>
						{s.ekos.collapse_sequence.no_sequences}
					</Typography>
				)}
			</Box>

			<SaveSequence
				selectFileName={selectFileName}
				setSelectFileName={() => setSelectFileName(false)}
				setFilename={(val) => setFilename(val)}
				filename={filename}
				saveSequence={saveSequence}
				loadFile={loadSequence}
			/>
			{showDirectoryBrowser && (
				<DirectoryBrowser
					toggle={() => setShowDirectoryBrowser(false)}
					fileExtension="esq"
					dir={defaultDir + "/sequences"}
					show={showDirectoryBrowser}
					selection={loadSequence}
					isFile
				/>
			)}
		</Box>
	);
};

const LOCAL_STYLES = {
	modal: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
		backgroundColor: "#0f0e0e",
		border: "2px solid #000",
		boxShadow: 24,
		p: 4,
		display: "flex",
		flexDirection: "row",
		gap: "12px",
		justifyContent: "center",
		alignItems: "center",
	},
	circle_hollow: {
		justifyContent: "center",
		alignItems: "center",
		width: "25px",
		height: "25px",
		borderRadius: "50%",
	},
	square_hollow: {
		justifyContent: "center",
		alignItems: "center",
		width: "25px",
		height: "25px",
		border: "1px solid white",
	},
	rectangle_hollow: {
		justifyContent: "center",
		alignItems: "center",
		width: "50px",
		height: "25px",
		border: "1px solid white",
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

export default Sequence;
