import React, { useCallback, useEffect, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { get, isEqual, isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { captureException } from "@sentry/browser";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import StopIcon from "@mui/icons-material/Stop";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import EditIcon from '@mui/icons-material/Edit';
import { ekosliveServer } from "@client/config";
import { Palette } from "@common/shared/common/styles";
import commands from "@common/shared/commands";
import {
	selectUser,
	selectConnectionOnline,
	selectProfiles,
	selectSelectedProfile,
} from "@redux/selectors";
import FeedbackPopup from "./FeedbackPopup";
import {
	schedulerActions,
	stellaActions,
	profileActions,
} from "@redux/actions";
import XMLDialog from "./XMLDialog";
import ImageBox from "./ImageBox";
import PromptCounter from "./PromptCounter";
import s from "@common/shared/i18n/i18n";
import Markdown from "react-markdown";
import { executePrompt, markPromptExecuted } from "@common/shared/utils/executePrompt";
import InputBox from "./InputBox";

const pathReplacer = (xmlString, path) =>
{
	 const regex = /<Sequence(?:\s*\/>|>(.*?)<\/Sequence>)/g;

	const updatedXmlString = xmlString.replace(
			regex,
			`<Sequence>${path}</Sequence>`,
	);

	return updatedXmlString;
};

const Message = ({
	prompt,
	setHistory,
	lastMessage,
	promptsLeft,
	executedPrompt,
	setExecutedPrompt,
	isExecuting,
	setIsExecuting,
	editPrompt,
}) =>
{
	const dispatch = useDispatch();


	const user = useSelector(selectUser);
	const [xml, setXml] = useState("");
	const [showFeedback, setShowFeedback] = useState(false);
	const [liked, setLiked] = useState();
	const sequenceFile = useSelector(
		(state) => state.setup.schedulerSequenceFile,
	);
	const promptId = useSelector((state) => state.stella.promptId);
	const executedPrompts = useSelector((state) => state.stella.executedPrompts);
	const ekosProfileRunnig = useSelector(selectConnectionOnline);
	const profiles = useSelector(selectProfiles, isEqual);
	const selectedProfile = useSelector(selectSelectedProfile, isEqual);
	const [isOpen, setIsOpen] = useState(true);
	const captureStatus = useSelector((state) => state.status.capture.status);
	const schedulerStatus = useSelector((state) => state.status.scheduler.status);
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState("");

	useEffect(() =>
	{
		if (prompt.scheduler && prompt._id === promptId && !isEmpty(sequenceFile))
		{
			const path = `Documents/scheduler/stella_${prompt._id}.esl`;
			const updatedXML = pathReplacer(prompt.scheduler, sequenceFile);
			dispatch(
				schedulerActions.loadFileData(
					updatedXML,
					path,
				),
			);
			dispatch(schedulerActions.toggleScheduler());
			toast.info("Executing scheduler...⏱️");
			setIsExecuting(false);
			dispatch(stellaActions.addExecutedPrompt(promptId));
			dispatch(stellaActions.setPromptId(""));
		}
	}, [sequenceFile]);

	const startProfile = () =>
	{
		// Check if the currently selected scopes are the same ones selected in the profile
		// if not, sync them and THEN start the profile.
		const profile = profiles.find(
			(item) => get(item, "name", "") === selectedProfile,
		);
		if (profile)
		{
			//set auto_connect to true, if its not checked by default.
			if (profile.auto_connect === false)
			{
				profile.auto_connect = true;
			}
			dispatch(profileActions.updateProfile(profile));
			dispatch(profileActions.saveSelectedProfile(profile.name));
			dispatch(profileActions.startProfile(profile));
		}
	};

	const postFeedback = useCallback(async (prompt, feedback) =>
	{
		if (!user) return;
		
		const url = `/api/stella/feedback?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		try
		{
			const { data } = await toast.promise(
				ekosliveServer.post(url, {
					id: prompt._id,
					feedback: { ...prompt.feedback, ...feedback },
				}),
				{
					pending: "Submitting feedback...",
					error: "Error submitting feedback.❌",
					success: "Feedback posted, thank you!✅",
				},
			);
			setHistory((prevHistory) =>
				prevHistory.map((message) =>
				{
					if (prompt._id !== message._id) return message;
					message.feedback = { ...message.feedback, ...data.prompt.feedback };
					return message;
				}),
			);
		}
		catch (error)
		{
			captureException(error);
		}
	}, []);

	const executed = async (promptId) => {
		await markPromptExecuted({
			promptId,
			username: user.username,
			token: user.token,
			ekosliveServer
		});
	};

	const execute = useCallback(async () => {
		// First clear sequence file
		dispatch({type: commands.SCHEDULER_SAVE_SEQUENCE_FILE, payload: ""});
		await executePrompt({
			prompt,
			dispatch,
			captureStatus,
			schedulerStatus,
			setExecutedPrompt,
			setIsExecuting,
			executed
		});
	}, [captureStatus, schedulerStatus, prompt]);

	useEffect(() =>
	{
		const hasSequence = !isEmpty(prompt.sequence);
		const hasScheduler = !isEmpty(prompt.scheduler);
		const executedPromptId = JSON.parse(localStorage.getItem("executedPromptId"));

		if (executedPromptId === prompt._id) {
			if (hasScheduler) {
				if (
					schedulerStatus === 0 ||
					schedulerStatus === 5 ||
					schedulerStatus === 6
				)
				{
					setExecutedPrompt("");
					setIsExecuting(false);
				}
				else
				{
					setIsExecuting(true);
				}
			}
			else if (hasSequence) {
				if (
					captureStatus === "Complete" ||
					captureStatus === "Idle" ||
					captureStatus === "Aborted" 
				)
				{
					setExecutedPrompt("");
					setIsExecuting(false);
				}
				else
				{
					setIsExecuting(true);
				}
			}
		}
	}, [captureStatus, schedulerStatus, prompt.sequence, prompt.scheduler]);

	useEffect(() =>
	{
		const savedExecutedPrompt = localStorage.getItem("executedPromptId");
		if (savedExecutedPrompt)
		{
			setExecutedPrompt(JSON.parse(savedExecutedPrompt));
		}
	}, []);

	const handleClose = () =>
	{
		setIsOpen(false);
	};

	const handleEditSubmit = async (value) => {
		if (!value.trim()) return;
		try {
			await editPrompt(prompt._id, value);
			setIsEditing(false);
		} catch (error) {
			console.error(error);
			toast.error("Failed to update prompt");
		}
	};

	return (
		<Grid item>
			<Paper
				sx={{
					...LOCAL_STYLES.containerStyles,
					border:
						(isExecuting && executedPrompt == prompt._id) || isEditing
							? "2px solid #ff6600"
							: null,
				}}
				elevation={2}
			>
				{isEditing ? (
					<Box sx={{ gridColumn: "span 2" }}>
						<InputBox 
							value={editValue}
							setValue={setEditValue}
							submitPrompt={handleEditSubmit}
							isEditing={true}
							onCancelEdit={() => setIsEditing(false)}
							promptsLeft={promptsLeft}
						/>
					</Box>
				) : (
					<Paper
						sx={{
							color: "common.white",
							padding: ".375rem",
							gridColumn: "span 2",
							backgroundColor: "#444",
							lineHeight: "24px",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							justifyContent: "space-between",
						}}
						elevation={2}
					>
						{prompt.prompt}
						<IconButton
							onClick={() => {
								setIsEditing(true);
								setEditValue(prompt.prompt);
							}}
							sx={{
								padding: "4px",
								'&:hover': {
									backgroundColor: 'rgba(255, 255, 255, 0.1)',
								}
							}}
						>
							<EditIcon sx={{ color: Palette.orange, fontSize: 16 }} />
						</IconButton>
					</Paper>
				)}
				
				<Typography sx={{ color: "common.white", lineHeight: 1.8, "& p": { marginBottom: "1rem" } }}>
					<Markdown components={{
						ul: ({children}) => <ul style={{listStyleType: 'disc', paddingLeft: '20px'}}>{children}</ul>,
						ol: ({children}) => <ol style={{listStyleType: 'decimal', paddingLeft: '20px'}}>{children}</ol>,
						li: ({children}) => <li style={{display: 'list-item'}}>{children}</li>
					}}>
						{prompt.response}
					</Markdown>
				</Typography>

				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: "6px",
						justifyItems: "center",
						height: "min-content",
						padding: "6px",
					}}
				>
					{prompt.type === "request" && (
						<Button
							sx={[
								LOCAL_STYLES.xmlButton,
								{
									gridColumn: "span 2",
									height: "fit-content",
									alignSelf: "flex-end",
									width: "fit-content",
									justifySelf: "center",
									padding: "4px",
								},
							]}
							variant="contained"
							onClick={execute}
							disabled={
								isExecuting && executedPrompt !== prompt._id
								? true
								: prompt.scheduler
									? false
									: !(prompt.sequence && ekosProfileRunnig)
							}
						>
							{isExecuting && executedPrompt === prompt._id ? (
								<StopIcon
									sx={{
										color: Palette.red,
										fontSize: 20,
										animation: "pulsate 1s infinite",
									}}
								/>
							) : executedPrompts.includes(prompt._id) ? (
								s.general.retry
							) : (
								s.general.execute
							)}
						</Button>
					)}
					<IconButton
						onClick={() =>
						{
							setShowFeedback(true);
							setLiked(true);
						}}
						sx={[LOCAL_STYLES.feedbackButton, { justifySelf: "flex-end" }]}
					>
						<ThumbUpIcon
							sx={{
								color: prompt.feedback?.liked ? Palette.green : Palette.white,
								fontSize: 20,
							}}
						/>
					</IconButton>
					<IconButton
						onClick={() =>
						{
							setShowFeedback(true);
							setLiked(false);
						}}
						sx={[LOCAL_STYLES.feedbackButton, { justifySelf: "flex-start" }]}
					>
						<ThumbDownIcon
							sx={{
								color:
									prompt.feedback && !prompt.feedback.liked
										? Palette.red
										: Palette.white,
								fontSize: 20,
							}}
						/>
					</IconButton>

					{prompt.type === "request" && (
						<>
							{prompt.sequence && (
								<IconButton
									sx={[
										LOCAL_STYLES.xmlButton,
										prompt.scheduler
											? null
											: { gridColumn: "span 2", justifySelf: "center" },
									]}
									onClick={() => setXml(prompt.sequence)}
								>
									<LibraryBooksIcon
										sx={{ color: Palette.white, fontSize: 20 }}
									/>
								</IconButton>
							)}
							{prompt.scheduler && (
								<IconButton
									sx={[LOCAL_STYLES.xmlButton]}
									onClick={() => setXml(prompt.scheduler)}
								>
									<PendingActionsIcon
										sx={{ color: Palette.white, fontSize: 20 }}
									/>
								</IconButton>
							)}
						</>
					)}
				</Box>

				{prompt.image && <ImageBox image={prompt.image} />}

				<Typography sx={LOCAL_STYLES.timestamp} component="span">
					{dayjs(prompt.createdAt).format("YYYY-MM-DD HH:mm")}&nbsp;
					{lastMessage && <PromptCounter promptsLeft={promptsLeft} />}
				</Typography>

				{lastMessage && isOpen && prompt.ekosRunning && !ekosProfileRunnig && (
					<Paper sx={[LOCAL_STYLES.confirmBox]} elevation={2}>
						{s.stella.confirm_ekos_running_question}
						<Box sx={[LOCAL_STYLES.confirmButtons]}>
							<Button
								sx={[
									LOCAL_STYLES.xmlButton,
									{
										gridColumn: "span 2",
										height: "fit-content",
										alignSelf: "flex-end",
										width: "fit-content",
										justifySelf: "center",
										padding: ".25rem",
									},
								]}
								variant="contained"
								onClick={startProfile}
							>
								Yes
							</Button>
							<Button
								sx={[
									LOCAL_STYLES.xmlButton,
									{
										gridColumn: "span 2",
										height: "fit-content",
										alignSelf: "flex-end",
										width: "fit-content",
										justifySelf: "center",
										padding: ".25rem",
									},
								]}
								variant="contained"
								onClick={handleClose}
							>
								No
							</Button>
						</Box>
					</Paper>
				)}
			</Paper>

			{xml && <XMLDialog xml={xml} onClose={() => setXml("")} />}
			{showFeedback && (
				<FeedbackPopup
					prompt={prompt}
					onClose={() => setShowFeedback(false)}
					postFeedback={postFeedback}
					liked={liked}
				/>
			)}
		</Grid>
	);
};

const LOCAL_STYLES = {
	containerStyles: {
		position: "relative",
		display: "grid",
		gridTemplateColumns: "8fr 1fr",
		backgroundColor: "#FFFCFA1F",
		borderRadius: "12px",
		padding: "14px 10px",
		rowGap: "12px",
		alignItems: "center",
	},
	xmlButton: {
		textTransform: "none",
		borderRadius: ".25rem",
		height: "30px",
		width: "30px",
		padding: 0,
	},
	feedbackButton: {
		borderRadius: "50%",
		width: "30px",
		height: "30px",
		justifyItems: "center",
		padding: 0,
	},
	timestamp: {
		position: "absolute",
		bottom: "4px",
		right: "6px",
		color: Palette.white,
		opacity: 0.7,
		whiteSpace: "nowrap",
		fontSize: "10px",
		display: "flex",
		alignItems: "center",
	},
	confirmBox: {
		color: Palette.white,
		padding: "6px",
		gridColumn: "span 2",
		backgroundColor: "#444",
		lineHeight: "24px",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyItems: "center",
		gap: "10px",
	},
	confirmButtons: {
		display: "flex",
		alignItems: "center",
		justifyItems: "center",
		gap: "30px",
	},
};

export default Message;
