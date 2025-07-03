import React, {
	createRef,
	useCallback,
	useRef,
	useState,
	useEffect,
} from "react";
import { useSelector } from "react-redux";
import Image from "mui-image";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Palette } from "@common/shared/common/styles";
import StellaLoader from "./StellaLoader";
import Dropzone from "./Dropzone";
import MoreSnackbar from "./MoreSnackbar";
import AudioRecorder from "@components/AudioRecorder";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";
import StopIcon from '@mui/icons-material/Stop';
import CloseIcon from '@mui/icons-material/Close';

const InputBox = ({
	submitPrompt,
	value,
	setValue,
	clearHistory,
	setShowModalImage,
	promptsLeft,
	isSpeaking,
	stopSpeaking,
	isEditing = false,
	onCancelEdit,
}) =>
{
	const [loading, setLoading] = useState(false);
	const [recording, setRecording] = useState(false);
	const [height, setHeight] = useState("40px");
	const [prompt, setPrompt] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [attachedFile, setAttachedFile] = useState(null);
	const [showMoreActions, setShowMoreActions] = useState(false);
	const inputRef = useRef(null);
	const dropzoneRef = createRef();
	const user = useSelector(selectUser);
	const audioRecorderRef = useRef(null);
	const autoRunRef = useRef(false);

	const handleAudioSave = async (audioBlob) =>
	{
		if (!user) return;
		
		const formData = new FormData();
		formData.append("audio", audioBlob, "recording.mp3");
		setRecording(false);

		const url = `api/stella/speech_to_text?username=${encodeURIComponent(user.username)}&token=${user.token}`;

		try
		{
			const response = await ekosliveServer.post(url, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});
			if (autoRunRef.current)
			{
				setValue("");
				setPrompt(value + (value ? ' ' : '') + response.data);
				setLoading(true);
				await submitPrompt(value + (value ? ' ' : '') + response.data, null);

				setLoading(false);
				setPrompt("");
				autoRunRef.current = false;
			}
			else
			{
				setValue((prev) => prev + (prev ? ' ' : '') + response.data);
				autoRunRef.current = false;
			}
		}
		catch (error)
		{
			console.log("Upload error: ", error);
		}
	};

	useEffect(() =>
	{
		if (autoRunRef.current && audioRecorderRef.current)
		{
			audioRecorderRef.current.stopRecording();
		}
	}, [recording]);

	const inputFocus = useCallback(() =>
	{
		if (promptsLeft === 0) return setShowModalImage(true);
		if (inputRef.current) {
			if (value && !value.endsWith(' ')) {
				setValue(prev => prev + ' ');
			}
			inputRef.current.focus();
			inputRef.current.selectionStart = inputRef.current.value.length;
			inputRef.current.selectionEnd = inputRef.current.value.length;
		}
	}, [inputRef, promptsLeft, value, setValue]);

	const handleSubmit = async (e) =>
	{
		e.preventDefault();

		if (recording)
		{
			setRecording(false);
			handleAudioSave();
			return;
		}

		if (!value.trim()) {
			return;
		}

		setPrompt(value);
		setLoading(true);
		try
		{
			setAttachedFile(null);
			setValue("");
			await submitPrompt(value, attachedFile);
			setHeight("40px");
			setLoading(false);
			setPrompt("");
			if (isEditing && onCancelEdit) {
				onCancelEdit();
			}
		}
		catch (error)
		{
			console.error(error);
			setLoading(false);
			setPrompt("");
		}
	};

	

	return (
		<form style={LOCAL_STYLES.formBox} onSubmit={handleSubmit}>
			{loading && <StellaLoader prompt={prompt} />}
			<Box
				id="stellaInput"
				sx={{
					width: "100%",
					position: "relative",
					backgroundColor: "#FFFCFA1F",
					borderRadius: "4px",
				}}
			>
				<label
					style={{
						position: "relative",
						display: "block",
						width: "100%",
						height: "fit-content",
					}}
				>
					<textarea
						value={value}
						style={{
							height: value ? height : "40px",
							...LOCAL_STYLES.inputBoxStyles,
						}}
						onKeyDown={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
						onChange={(e) =>
						{
							setValue(e.target.value);
							setHeight(`${e.target.scrollHeight}px`);
						}}
						placeholder={isEditing ? "Edit your prompt" : "Enter your prompt"}
						name="prompt"
						required
						ref={inputRef}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
					/>
					<Box
						id="stellaFunctions"
						sx={{
							position: "absolute",
							top: "50%",
							right: "6px",
							transform: "translateY(-50%)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: "4px",
							zIndex: 2,
						}}
					>
						{isEditing ? (
							<IconButton
								sx={[
									LOCAL_STYLES.inputIconStyles,
									{
										'&:hover': {
											backgroundColor: 'rgba(255, 255, 255, 0.1)',
										}
									}
								]}
								onClick={onCancelEdit}
							>
								<CloseIcon sx={{ color: Palette.white, fontSize: 20 }} />
							</IconButton>
						) : 
							isSpeaking && (
							<Box
								sx={{
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
									background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 255, 0, 0.15) 100%)',
									padding: '4px 12px',
									borderRadius: '24px',
									transition: 'all 0.3s ease',
									'&:hover': {
										background: 'linear-gradient(90deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 255, 0, 0.2) 100%)',
									}
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
									{[...Array(3)].map((_, i) => (
										<Box
											key={i}
											sx={{
												width: '3px',
												height: '12px',
												backgroundColor: Palette.green,
												borderRadius: '8px',
												animation: `waveform ${0.8 + i * 0.2}s ease-in-out infinite`,
											}}
										/>
									))}
								</Box>
								<IconButton
									sx={[
										LOCAL_STYLES.inputIconStyles,
										{
											'&:hover': {
												backgroundColor: 'rgba(255, 255, 255, 0.1)',
											}
										}
									]}
									onClick={stopSpeaking}
									title="Stop Speaking"
								>
									<StopIcon sx={{ color: Palette.green, fontSize: 18 }} />
								</IconButton>
							</Box>
						)} 

						{!isEditing && (
							<IconButton
								onClick={() => dropzoneRef.current ? dropzoneRef.current() : null}
								sx={[LOCAL_STYLES.inputIconStyles]}
								type="button"
							>
								<AttachFileIcon sx={{ color: Palette.white, fontSize: 20 }} />
							</IconButton>
						)}

						<AudioRecorder
							ref={audioRecorderRef}
							onRecordingComplete={handleAudioSave}
							onStart={() => setRecording(true)}
							onStop={() => setRecording(false)}
						/>

						{recording ? (
							<IconButton
								disabled={loading}
								sx={[LOCAL_STYLES.inputIconStyles]}
								onClick={(e) => {
									e.preventDefault();
									autoRunRef.current = true;
									setRecording(false);
								}}
							>
								<SendIcon
									sx={{
										color: Palette.red,
										fontSize: 20,
										animation: "pulsate 1s infinite",
									}}
								/>
							</IconButton>
						) : (
							<IconButton
								disabled={loading}
								sx={[LOCAL_STYLES.inputIconStyles]}
								type="submit"
							>
								<SendIcon sx={{ color: Palette.white, fontSize: 20 }} />
							</IconButton>
						)}

<style jsx="true">{`
							@keyframes pulsate {
								0% {
									transform: scale(1);
									opacity: 1;
								}
								50% {
									transform: scale(1.2);
									opacity: 0.7;
								}
								100% {
									transform: scale(1);
									opacity: 1;
								}
							}
						`}</style>

						<style jsx="true">{`
							@keyframes waveform {
								0% {
									transform: scaleY(0.4);
								}
								50% {
									transform: scaleY(1);
								}
								100% {
									transform: scaleY(0.4);
								}
							}
						`}</style>

						{!isEditing && (
							<Box sx={{ position: "relative" }}>
								<IconButton
									sx={[LOCAL_STYLES.inputIconStyles]}
									onClick={() => setShowMoreActions((prevState) => !prevState)}
								>
									<MoreHorizIcon sx={{ color: Palette.white, fontSize: 20 }} />
								</IconButton>
								<MoreSnackbar
									open={showMoreActions}
									close={() => setShowMoreActions(false)}
									clearHistory={clearHistory}
								/>
							</Box>
						)}
					</Box>
				</label>
				{!isEditing && (
					<Dropzone
						onFocus={inputFocus}
						isFocused={isFocused}
						ref={dropzoneRef}
						imageHandler={setAttachedFile}
					/>
				)}
				{attachedFile && (
					<Image
						src={attachedFile?.imageValue}
						alt="label for the attached file"
						duration={1}
						wrapperStyle={LOCAL_STYLES.imageBox}
						style={{ objectFit: "fill" }}
					/>
				)}
			</Box>
		</form>
	);
};

const LOCAL_STYLES = {
	formBox: {
		width: "100%",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		gap: "10px",
		alignItems: "center",
		boxSizing: "border-box",
	},
	inputBoxStyles: {
		padding: "6px 92px 6px 6px",
		width: "100%",
		backgroundColor: "transparent",
		color: Palette.white,
		borderRadius: "4px",
		boxSizing: "border-box",
		alignContent: "center",
		overflow: "hidden",
	},
	inputIconStyles: {
		padding: 0,
	},
	imageBox: {
		width: "100px",
		height: "100px",
		margin: "4px",
	},
};

export default InputBox;
