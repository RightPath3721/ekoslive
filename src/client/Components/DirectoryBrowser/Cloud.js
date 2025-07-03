import { ekosliveServer } from "@client/config";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { selectUser } from "@redux/selectors";
import { get, isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Palette } from "@common/shared/common/styles";
import { captureActions } from "@redux/actions";
import { planType } from "@indi/enums";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";
import Icon from "@components/Icon";
import { styles } from "@client/shared/styles";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import AlertDialog from "@components/AlertDialog";
import s from "@common/shared/i18n/i18n";
import { toast } from "react-toastify";

const Cloud = (props) =>
{
	const dispatch = useDispatch();
	const user = useSelector(selectUser);
	const sequenceFile = useSelector((state) => state.ekos.sequenceFile, isEqual);
	const [sequences, setSequences] = useState([]);
	const [selected, setSelected] = useState(false);
	const [filename, setFilename] = useState("");
	const [showAlert, setShowAlert] = useState(false);

	const { toggle, fileExtension, selection } = props;

	const isScheduler = fileExtension === "esl";

	const truncateFilename = (filename, maxLength = 15) =>
	{
		if (filename.length <= maxLength) return filename;
		const extension = filename.split(".").pop();
		return `${filename.slice(0, maxLength)}...${extension}`;
	};

	const handleDelete = async () =>
	{
		try
		{
			if (!user) return null;
			
			const url = `/api/cloud/delete-file?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			await ekosliveServer.post(url, {
				filename,
			});
			await fetchFiles();
			toast.success(s.general.success);
			setShowAlert(false);
		}
		catch (error)
		{
			console.log("Error: ", error);
		}
	};

	const fetchFiles = async () =>
	{
		let type = "sequences";
		if (isScheduler) type = "scheduler";

		if (!user) return null;

		let url = `/api/cloud/${type}?username=${encodeURIComponent(user.username)}&token=${user.token}`;

		const result = await ekosliveServer.get(url);
		if (!isEmpty(get(result, "data.sequences", [])))
		{
			setSequences(result.data.sequences);
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
		await fetchFiles();
	}, []);

	useEffectAsync(async () =>
	{
		if (!isEmpty(sequenceFile) && selected)
		{
			if (isScheduler)
			{
				dispatch(captureActions.clearSequences());
				selection(get(sequenceFile, "path", ""));
			}
			else
			{
				const path = get(sequenceFile, "path", "");
				selection(path);
			}
			setSelected(false);
			toggle();
		}
	}, [sequenceFile]);

	if (user && user.plan_id === planType.DEFAULT)
	{
		return (
			<CurrentPlanInformer
				toggle={toggle}
				text="Update to pro to use Cloud Storage"
			/>
		);
	}
	return (
		<Box sx={styles.row}>
			{!isEmpty(sequences) ? (
				<Box
					sx={[
						LOCAL_STYLES.listBox,
						{
							gridTemplateColumns:
								sequences.length > 5
									? "repeat(5, 1fr)"
									: `repeat(${sequences.length}, 1fr)`,
						},
					]}
				>
					{sequences.map((oneSequence, index) =>
						{
						const filename = get(oneSequence, "filename", "");
						if (isEmpty(filename)) return null;
						return (
							<Box key={index} sx={LOCAL_STYLES.folderView}>
								<Tooltip title={filename}>
									<Button
										onClick={async () =>
											{
											if (!user) return null;
											const url = `/api/cloud/onesequence?username=${encodeURIComponent(user.username)}&token=${user.token}`;
											const response = await ekosliveServer.post(url, {
												filename: filename,
											});
											const filedata = get(response, "data.content", "");
											if (!isEmpty(filedata))
												{
												setSelected(true);
												dispatch(captureActions.loadSequenceFile("", filedata));
											}
										}}
									>
										<Typography sx={LOCAL_STYLES.folderItem}>
											{truncateFilename(filename)}
										</Typography>
									</Button>
								</Tooltip>
								<Box sx={{ marginTop: "5px" }}>
									<Icon
										onClick={async () =>
											{
											setFilename(filename);
											setShowAlert(true);
										}}
										color={Palette.red}
										size={22}
										name="delete"
									/>
								</Box>
							</Box>
						);
					})}
					<AlertDialog
						show={showAlert}
						close={() => setShowAlert(false)}
						handleDelete={async () => await handleDelete()}
						title={s.general.confirm_delete}
						description={`Are you sure to delete ${filename}?`}
						yes={true}
						icon={<RemoveCircleOutlineIcon color="error" />}
					/>
				</Box>
			) : (
				<Box>
					<Typography>No files found</Typography>
				</Box>
			)}
		</Box>
	);
};

export default Cloud;

const LOCAL_STYLES = {
	folderView: {
		flexDirection: "row",
		color: "white",
		backgroundColor: "#FFFCFA1F",
		display: "flex",
		maxWidth: "100%",
		padding: "5px",
		borderRadius: "5px",
		overflow: "hidden",
	},
	folderItem: {
		color: "white",
		fontSize: "15px",
		position: "relative",
		backgroundColor: "#444",
		padding: "5px 10px",
		borderRadius: "3px",
		maxWidth: "150px",
		width: "150px",
		textAlign: "center",
		overflow: "hidden",
		whiteSpace: "nowrap",
		textOverflow: "ellipsis",
		cursor: "pointer",
	},
	listBox: {
		display: "grid",
		gap: "4px",
		alignItems: "center",
		padding: "15px",
	},
};
