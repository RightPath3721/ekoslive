import React, { useState } from "react";
import { captureException } from "@sentry/browser";
import Rating from "@mui/material/Rating";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Palette } from "@common/shared/common/styles";
import EkosModal from "@components/EkosModal";
import s from "@common/shared/i18n/i18n";

const FeedbackPopup = ({ prompt, onClose, postFeedback, liked }) =>
{
	const [feedbackData, setFeedbackData] = useState({
		rating: prompt.feedback?.rating ?? 0,
		feedback: prompt.feedback?.feedback ?? "",
		liked,
	});

	const handleSubmit = async (e) =>
	{
		e.preventDefault();

		try
		{
			await postFeedback(prompt, feedbackData);
			onClose();
		}
		catch (error)
		{
			captureException(error);
		}
	};

	return (
		<EkosModal
			onClose={() =>
			{
				postFeedback(prompt, { liked });
				onClose();
			}}
			sx={{ padding: "34px 18px 18px" }}
		>
			<form
				onSubmit={handleSubmit}
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "10px",
					justifyContent: "space-around",
					alignItems: "center",
					minWidth: "280px",
					minHeight: "200px",
				}}
			>
				<Typography sx={{ width: "max-content", color: Palette.white }}>
					Please provide additional feedback
				</Typography>
				<Rating
					value={feedbackData.rating}
					onChange={(_, newValue) =>
						setFeedbackData((prevData) => ({ ...prevData, rating: newValue }))
					}
					sx={{
						".MuiRating-iconEmpty": { color: Palette.white },
					}}
				/>
				<TextareaAutosize
					style={{
						padding: "6px",
						width: "100%",
						backgroundColor: "#FFFCFA1F",
						color: Palette.white,
						borderRadius: "4px",
						boxSizing: "border-box",
					}}
					value={feedbackData.feedback}
					onKeyDown={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
					onChange={(e) =>
						setFeedbackData((prevData) => ({
							...prevData,
							feedback: e.target.value,
						}))
					}
					placeholder="(Optional) Feel free to add specific details"
					name="prompt"
					autoFocus
				/>
				<Button
					sx={{
						backgroundColor: "#ff6600",
						color: "#FFFFFF",
						textTransform: "none",
						border: "1px solid #2d2d2d",
					}}
					type="submit"
				>
					{s.general.confirm}
				</Button>
			</form>
		</EkosModal>
	);
};

export default FeedbackPopup;
