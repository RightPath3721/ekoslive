import React, { useCallback, useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import { toast } from "react-toastify";
import isEmpty from "lodash/isEmpty";
import unionBy from "lodash/unionBy";
import get from "lodash/get";
import { captureException } from "@sentry/browser";
import InputBox from "./InputBox";
import { useDispatch, useSelector } from "react-redux";
import {
	selectUser,
	selectTargetsObjects,
	selectConnected,
	selectConnectionOnline,
} from "@redux/selectors";
import {
	captureActions,
	schedulerActions,
	targetsActions,
	stellaActions,
	optionActions,
} from "@redux/actions";
import { ekosliveServer } from "@client/config";
import Chat from "./Chat";
import PromptsExample from "./PromptsExample";
import functionTools from "@common/shared/common/functionTools";
import PricingTableModal from "@components/PricingTableModal";
import s from "@common/shared/i18n/i18n";
import { opticalTrainActions } from "@redux/actions";
import { optionsConstants } from "@redux/constants";
import tourGuide from "@components/global/tourGuide";
import CurrentPlanInformer from "@components/shared/PricingTable/CurrentPlanInformer";
import { planType } from "@indi/enums";
import dayjs from "dayjs";
import {
	toAZ,
	toDMS,
	toHMS,
	toHA,
	PierSides,
} from "@common/shared/common/common";
import { executePrompt, markPromptExecuted } from "@common/shared/utils/executePrompt";

const deleteHistory = async (username, token) =>
{
	const url = `/api/stella/prompts?username=${encodeURIComponent(username)}&token=${token}`;
	try
	{
		const { data } = await ekosliveServer.delete(url);
		if (!data.success) throw new Error(data.error);
	}
	catch (error)
	{
		captureException(error);
		return error;
	}
};

const tourGuideSteps = [
	{
		selector: "#Stella",
		content: s.tourGuide.description_stella_intro,
	},
	{
		selector: "#stellaExample",
		content: s.tourGuide.description_stella_example,
	},
	{
		selector: "#stellaChat",
		content: s.tourGuide.description_stella_chat,
	},
	{
		selector: "#stellaInput",
		content: s.tourGuide.description_stella_input,
	},

	{
		selector: "#stellaFunctions",
		content: s.tourGuide.description_stella_other_function,
	},
];

const Stella = ({ active }) =>
{
	const dispatch = useDispatch();
	const showExamples = useSelector((state) => state.stella.showExamples);
	const narrateResponse = useSelector((state) => state.stella.narrateResponse);
	const [userPrompt, setUserPrompt] = useState("");
	const user = useSelector(selectUser);
	const [chatHistory, setChatHistory] = useState([]);
	const getObjectInfo = useSelector(selectTargetsObjects);
	const [promptsLeft, setPromptsLeft] = useState();
	const [showModalImage, setShowModalImage] = useState(false);
	const connected = useSelector(selectConnected);
	const ekosProfileRunning = useSelector(selectConnectionOnline);
	const [executedPrompt, setExecutedPrompt] = useState("");
	const [isExecuting, setIsExecuting] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const audioRef = useRef(null);

	// Settings required for submit
	const selectedTrainSettings = useSelector(
		(state) => state.opticalTrain.selectedTrainSettings,
	);

	const schedulerSettings = useSelector(
		(state) => state.ekos.schedulerSettings,
	);
	const filterSettings = useSelector((state) => state.ekos.filterSettings);
	const status = useSelector((state) => state.status);
	const captureSettings = useSelector((state) => state.ekos.captureSettings);
	const captureStatus = useSelector((state) => state.status.capture.status);
	const schedulerStatus = useSelector((state) => state.status.scheduler.status);

	const ekosOptions = useSelector((state) => state.ekos.options);
	const [captureTrainID, setCaptureTrainID] = useState(-1);

	// Do we have connection to KStars?
	const kstarsConnected = useSelector(
		(state) => state.ekos.connection.connected,
	);

	useEffect(() =>
	{
		if (ekosProfileRunning)
		{
			dispatch(captureActions.getFilterSettings());
			dispatch(captureActions.getAllSettings());
		}
	}, [ekosProfileRunning, userPrompt]);

	useEffect(() =>
	{
		dispatch(targetsActions.loadHiPSCache(getObjectInfo));

		if (connected) dispatch(targetsActions.getAlmanac());
	}, [connected]);

	useEffect(() =>
	{
		if (user?.username && user?.token) {  // Only proceed if we have user data
			(async () =>
			{
				try
				{
					await ekosliveServer.get(
						`api/astrometry/login?username=${encodeURIComponent(user.username)}&token=${user.token}`,
					);
					// session id need to be stored somewhere
				}
				catch (error)
				{
					captureException(error);
				}
			})();
		}
	}, [user]); // Add user to dependency array

	/**
	 * Update last used Capture Train ID from options.
	 */
	useEffect(() =>
	{
		if (kstarsConnected)
		{
			if (isEmpty(ekosOptions))
			{
				dispatch(
					optionActions.getOptions([{ name: optionsConstants.captureTrainID }]),
				);
			}
			else
			{
				const id = ekosOptions.find(
					(oneOption) => oneOption.name === optionsConstants.captureTrainID,
				);
				if (id)
				{
					setCaptureTrainID(get(id, "value", -1));
				}
			}
		}
	}, [kstarsConnected, ekosOptions]);

	/**
	 * We must get all capture and schedule settings when KStars is connected
	 * Since we need them to fetch XML.
	 */
	useEffect(() =>
	{
		if (kstarsConnected)
		{
			dispatch(schedulerActions.getAllSettings());

			if (captureTrainID > 0)
				dispatch(opticalTrainActions.getSelectedTrainSettings(captureTrainID));
		}
	}, [kstarsConnected, captureTrainID]);

	const getXml = async (data, promptId) =>
	{
		if (!user) return null;

		const url = `api/stella/get_xml?username=${encodeURIComponent(user.username)}&token=${user.token}`;

		try
		{
			// Cannot generate XML without previous settings
			if (isEmpty(selectedTrainSettings))
			{
				toast.warn(s.stella.confirm_train_settings);
				return null;
			}

			// Prefer capture settings if available
			const sequenceSettings = isEmpty(captureSettings)
				? selectedTrainSettings[0]
				: captureSettings;

			const filter = isEmpty(filterSettings)
				? get(selectedTrainSettings[0], "filtersList", [])
				: filterSettings.filters.map((oneFilter) => oneFilter.label);

			const response = await ekosliveServer.post(url, {
				value: data,
				id: promptId,
				sequence: sequenceSettings,
				scheduler: schedulerSettings,
				filter: filter,
			});

			return response.data;
		}
		catch (error)
		{
			captureException(error, { addAttachment: { data, promptId } });
			return error;
		}
	};

	const saveResult = async (data, promptId) =>
	{
		if (!user) return null;
		const url = `api/stella/save_result?username=${encodeURIComponent(user.username)}&token=${user.token}`;
		try
		{
			const payload = { value: data };

			// Conditionally include promptId in the payload if it's provided
			if (promptId !== undefined && promptId !== null)
			{
				payload.id = promptId;
			}

			const response = await ekosliveServer.post(url, payload);

			return response.data;
		}
		catch (error)
		{
			console.error(error);
			return error;
		}
	};

	const stopSpeaking = useCallback(() =>
	{
		if (audioRef.current)
		{
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			setIsSpeaking(false);
		}
	}, []);

	const [isLoading, setIsLoading] = useState(false);

	const textToSpeech = async (text) =>
	{
		if (!user) return null;

		try
		{
			// Stop any existing audio playback
			if (audioRef.current)
			{
				stopSpeaking();
			}

			setIsLoading(true);

			// Create new audio element
			const url = `/api/stella/text_to_speech/stream?username=${encodeURIComponent(user.username)}&token=${user.token}&text=${text}`;
			const audio = new Audio();

			// Wait for audio to be ready
			await new Promise((resolve, reject) =>
			{
				const handleCanPlay = () =>
				{
					audio.removeEventListener("canplaythrough", handleCanPlay);
					resolve();
				};

				const handleError = (e) =>
				{
					audio.removeEventListener("error", handleError);
					reject(e);
				};

				audio.addEventListener("canplaythrough", handleCanPlay);
				audio.addEventListener("error", handleError);

				// Set up other event listeners
				audio.addEventListener("ended", () =>
				{
					setIsSpeaking(false);
					audio.remove(); // Clean up the element
				});

				audio.src = url;
				audio.load(); // Explicitly load the audio
			});

			// Store reference and play
			audioRef.current = audio;
			await audio.play();
			setIsSpeaking(true);
		}
		catch (error)
		{
			setIsSpeaking(false);
			captureException(error);
		}
		finally
		{
			setIsLoading(false);
		}
	};

	const executed = async (promptId) =>
	{
		await markPromptExecuted({
			promptId,
			username: user.username,
			token: user.token,
			ekosliveServer
		});
	};

	const execute = useCallback(
		async (prompt) =>
		{
			await executePrompt({
				prompt,
				dispatch,
				captureStatus,
				schedulerStatus,
				setExecutedPrompt,
				setIsExecuting,
				executed,
				getPrompts
			});
		},
		[captureStatus, schedulerStatus]
	);

	const sendPrompt = useCallback(
		async (data, attachedFile) =>
		{
			if (!user) return null;

			if (chatHistory.length > 0)
			{
				const lastMessage = chatHistory[chatHistory.length - 1];
				if (data.toLowerCase() === "execute")
				{
					if (
						lastMessage.scheduler ||
						(lastMessage.sequence &&
							!lastMessage.scheduler &&
							ekosProfileRunning)
					)
					{
						execute(lastMessage);
						return;
					}
					else if (
						lastMessage.sequence &&
						!lastMessage.scheduler &&
						!ekosProfileRunning
					)
					{
						toast.warn(s.stella.confirm_ekos_running);
						return;
					}
				}
			}

			const url = `/api/stella/submit?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			try
			{
				let fileData;
				let objectsInImage;
				if (attachedFile)
				{
					try
					{
						let file;
						const formData = new FormData();
						const url = attachedFile.imageValue;
						await fetch(url)
							.then((res) => res.blob())
							.then((blob) =>
							{
								file = new File([blob], "File name", {
									type: "application/octet-stream",
								});
							});
						formData.append("file", file);
						const { data } = await toast.promise(
							ekosliveServer.post(
								`api/astrometry/upload?username=${encodeURIComponent(user.username)}&token=${user.token}`,
								formData,
							),
							{
								pending: s.stella.notifications.image.pending,
								error: s.stella.notifications.image.error,
								success: s.stella.notifications.image.success,
							},
						);
						fileData = data;
					}
					catch (error)
					{
						captureException(error);
					}
				}
				if (fileData)
				{
					objectsInImage = fileData.response.objects_in_field || [];
				}

				let confirmResponse;
				if (objectsInImage && objectsInImage.length > 0)
				{
					const objectList = objectsInImage.map((obj) => `- ${obj}`).join("\n");
					const response = `There are following objects: \n${objectList}`;
					confirmResponse = {
						data: {
							success: true,
							response: response,
							prompt: {
								username: user.username,
								prompt: data,
								response: response,
								type: "general",
								summary: response,
								ekosRunning: false,
							},
						},
					};
					await saveResult(confirmResponse.data.prompt);
				}
				else
				{
					confirmResponse = await toast.promise(
						ekosliveServer.post(url, {
							prompt: data,
							source: "WEB",
							status: {
								...status,
								mount: {
									...status.mount,
									ra: toHMS(status?.mount?.ra),
									de: toDMS(status?.mount?.de),
									az: toAZ(status?.mount?.az),
									at: toDMS(status?.mount?.at),
									pierSide: PierSides[status?.mount?.pierSide],
									ha: toHA(status?.mount?.ha),
									de0: toDMS(status?.mount?.de0),
									ra0: toHMS(status?.mount?.ra0),
								},
								dome: {
									...status.dome,
									az: toAZ(status?.dome?.az),
								}
							},
						}),
						{
							success: s.general.success,
							error: s.general.failed,
						},
					);
				}
				if (!confirmResponse.data.success)
					throw new Error(confirmResponse.data.error);

				if (confirmResponse.data.prompt.type === "request")
				{
					const updatedPrompt = await toast.promise(
						new Promise(async (resolve, reject) =>
						{
							const result = await getXml(
								confirmResponse.data.response.replace(
									"Tap or Say Execute to proceed.",
									"",
								),
								confirmResponse.data.prompt._id,
							);
							if (!result || !result.success) reject(result?.error);
							resolve(result);
						}),
						{
							pending: s.stella.notifications.XML.pending,
							error: s.stella.notifications.XML.error,
							success: s.stella.notifications.XML.success,
						},
					);

					narrateResponse && textToSpeech(updatedPrompt.prompt.response);

					setChatHistory((prevHistory) => [
						...prevHistory,
						updatedPrompt.prompt,
					]);
					return;
				}
				else if (confirmResponse.data.prompt.type === "general")
				{
					if (confirmResponse.data.response.function_name)
					{
						const { function_name, function_args } =
							confirmResponse.data.response;
						const data = await functionTools(function_name, function_args);

						const updatedPrompt = await toast.promise(
							new Promise(async (resolve, reject) =>
							{
								const result = await saveResult(
									data,
									confirmResponse.data.prompt._id,
								);
								if (data == s.stella.confirm_ekos_running)
								{
									toast.warn(data);
									resolve(result);
								}
								if (!result?.success)
								{
									reject(result.error);
								}
								resolve(result);
							}),
							{
								pending: s.stella.notifications.pending,
								error: s.general.failed,
								success: s.general.success,
							},
						);
						narrateResponse && textToSpeech(updatedPrompt.prompt.response);

						setChatHistory((prevHistory) => [
							...prevHistory,
							updatedPrompt.prompt,
						]);
						return;
					}
				}

				narrateResponse && textToSpeech(confirmResponse.data.prompt.response);

				setChatHistory((prevHistory) => [
					...prevHistory,
					confirmResponse.data.prompt,
				]);
			}
			catch (err)
			{
				captureException(err);
				setIsSpeaking(false);
			}
		},
		[chatHistory],
	);

	const editPrompt = async (promptId, newText) => {
		try {
			if (!user) return null;
			
			const url = `/api/stella/submit?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const confirmResponse = await toast.promise(
				ekosliveServer.post(url, {
					prompt: newText,
					promptId: promptId,
					source: "WEB",
					status: {
						...status,
						mount: {
							...status.mount,
							ra: toHMS(status?.mount?.ra),
							de: toDMS(status?.mount?.de),
							az: toAZ(status?.mount?.az),
							at: toDMS(status?.mount?.at),
							pierSide: PierSides[status?.mount?.pierSide],
							ha: toHA(status?.mount?.ha),
							de0: toDMS(status?.mount?.de0),
							ra0: toHMS(status?.mount?.ra0),
						},
						dome: {
							...status.dome,
							az: toAZ(status?.dome?.az),
						}
					},
				}),
				{
					success: s.general.success,
					error: s.general.failed,
				},
			);

			if (!confirmResponse.data.success) throw new Error(confirmResponse.data.error);

			if (confirmResponse.data.prompt.type === "request") {
				const updatedPrompt = await toast.promise(
					new Promise(async (resolve, reject) => {
						const result = await getXml(
							confirmResponse.data.response.replace(
								"Tap or Say Execute to proceed.",
								"",
							),
							confirmResponse.data.prompt._id,
						);
						if (!result || !result.success) reject(result?.error);
						resolve(result);
					}),
					{
						pending: s.stella.notifications.XML.pending,
						error: s.stella.notifications.XML.error,
						success: s.stella.notifications.XML.success,
					},
				);

				narrateResponse && textToSpeech(updatedPrompt.prompt.response);

				// Update the specific message in chat history
				setChatHistory(prevHistory => 
					prevHistory.map(message => 
						message._id === promptId 
							? updatedPrompt.prompt
							: message
					)
				);
				return;
			} else if (confirmResponse.data.prompt.type === "general") {
				if (confirmResponse.data.response.function_name) {
					const { function_name, function_args } = confirmResponse.data.response;
					const data = await functionTools(function_name, function_args);

					const updatedPrompt = await toast.promise(
						new Promise(async (resolve, reject) => {
							const result = await saveResult(
								data,
								confirmResponse.data.prompt._id,
							);
							if (data == s.stella.confirm_ekos_running) {
								toast.warn(data);
								resolve(result);
							}
							if (!result?.success) {
								reject(result.error);
							}
							resolve(result);
						}),
						{
							pending: s.stella.notifications.pending,
							error: s.general.failed,
							success: s.general.success,
						},
					);

					narrateResponse && textToSpeech(updatedPrompt.prompt.response);

					// Update the specific message in chat history
					setChatHistory(prevHistory => 
						prevHistory.map(message => 
							message._id === promptId 
								? updatedPrompt.prompt
								: message
						)
					);
					return;
				}
			}

			narrateResponse && textToSpeech(confirmResponse.data.prompt.response);

			// Update the specific message in chat history
			setChatHistory(prevHistory => 
				prevHistory.map(message => 
					message._id === promptId 
						? confirmResponse.data.prompt
						: message
				)
			);
		} catch (err) {
			captureException(err);
			setIsSpeaking(false);
			toast.error("Failed to update prompt");
		}
	};

	const getPrompts = useCallback(
		async (page) =>
		{
			try
			{
				const url = `/api/stella/prompts?username=${encodeURIComponent(user.username)}&token=${user.token}&page=${page}`;
				const prompts = await ekosliveServer.get(url);
				if (!prompts.data.success) throw new Error(prompts.data.error);

				setChatHistory((prevState) =>
					unionBy(prompts.data.prompts, prevState, "_id"),
				);

				return prompts.data.prompts.length;
			}
			catch (error)
			{
				captureException(error);
			}
		},
		[user],
	);

	const clearHistory = useCallback(async () =>
	{
		await deleteHistory(user.username, user.token);
		setChatHistory([]);
	}, [setChatHistory, user]);

	// Clean up audio on unmount
	useEffect(() =>
	{
		return () =>
		{
			if (audioRef.current)
			{
				// Remove event listeners to prevent memory leaks
				audioRef.current.removeEventListener("ended", () =>
					setIsSpeaking(false),
				);
				audioRef.current.removeEventListener("error", () =>
					setIsSpeaking(false),
				);
				stopSpeaking();
				audioRef.current = null;
			}
		};
	}, [stopSpeaking]);

	if (!active) return null;

	return (
		<Box
			sx={[
				LOCAL_STYLES.containerStyles,
				{
					gridTemplateRows: showExamples
						? user && user.plan_id === planType.DEFAULT
							? "1fr 2fr 9fr 1fr"
							: "2fr 9fr 1fr"
						: user && user.plan_id === planType.DEFAULT
							? "auto 1fr auto"
							: "1fr auto",
				},
			]}
		>
			{user && user.plan_id === planType.DEFAULT && <CurrentPlanInformer />}
			{showExamples && <PromptsExample setValue={setUserPrompt} />}
			<Chat
				history={chatHistory}
				setHistory={setChatHistory}
				getPrompts={getPrompts}
				promptsLeft={promptsLeft}
				setPromptsLeft={setPromptsLeft}
				executedPrompt={executedPrompt}
				setExecutedPrompt={setExecutedPrompt}
				isExecuting={isExecuting}
				setIsExecuting={setIsExecuting}
				editPrompt={editPrompt}
			/>
			<InputBox
				value={userPrompt}
				setValue={setUserPrompt}
				submitPrompt={sendPrompt}
				clearHistory={clearHistory}
				setShowModalImage={setShowModalImage}
				promptsLeft={promptsLeft}
				isSpeaking={isSpeaking}
				stopSpeaking={stopSpeaking}
			/>
			<PricingTableModal
				close={() => setShowModalImage(false)}
				open={showModalImage}
			/>
		</Box>
	);
};

const LOCAL_STYLES = {
	containerStyles: {
		width: "100%",
		height: "85vh",
		display: "grid",
		rowGap: "12px",
		margin: "8px",
		padding: "10px",
		backgroundColor: "#FFFCFA1F",
		borderRadius: "4px",
	},
};

export default tourGuide(Stella, {
	steps: tourGuideSteps,
	key: "stella",
});
