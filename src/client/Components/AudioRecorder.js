import React, { useImperativeHandle, forwardRef } from "react";
import { ReactMediaRecorder } from "react-media-recorder-2";
import KeyboardVoiceIcon from "@mui/icons-material/KeyboardVoice";
import { Palette } from "@common/shared/common/styles";

const AudioRecorder = forwardRef(
	({ onRecordingComplete, onStart, onStop }, ref) =>
	{
		let startRecordingFn, stopRecordingFn;
		useImperativeHandle(
			ref,
			() => ({
				startRecording: () => startRecordingFn(),
				stopRecording: () => stopRecordingFn(),
			}),
			[startRecordingFn, stopRecordingFn],
		);
		return (
			<div>
				<ReactMediaRecorder
					audio
					onStart={onStart}
					onStop={(blobUrl, blob) =>
					{
						onStop();
						onRecordingComplete(blob);
					}}
					render={({ status, startRecording, stopRecording }) =>
					{
						startRecordingFn = startRecording;
						stopRecordingFn = stopRecording;

						return (
							<div>
								{status !== "recording" ? (
									<KeyboardVoiceIcon
										onClick={startRecording}
										sx={{ 
											color: Palette.white, 
											fontSize: 20,
											cursor: 'pointer' 
										}}
									/>
								) : (
									<KeyboardVoiceIcon
										onClick={stopRecording}
										sx={{
											color: "red",
											fontSize: 20,
											animation: "pulsate 1s infinite",
											cursor: 'pointer'
										}}
									/>
								)}

								{/* Inline CSS for pulsating effect */}
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
							</div>
						);
					}}
				/>
			</div>
		);
	},
);

export default AudioRecorder;
