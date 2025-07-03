import React, { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { useSelector } from "react-redux";
import RefreshIcon from "@mui/icons-material/Refresh";
import { captureException } from "@sentry/browser";
import { ekosliveServer } from "../../config";
import { Palette } from "@common/shared/common/styles";
import { selectUser } from "@redux/selectors";

const sample_question = [
	"Capture a flat frame with ADU 24000 then create dark flats for it.",
	"Take a 30-second 2x2 exposure for Altair using XISF format",
	"Create a 100 LRGB sequences each 10 seconds long",
];

const PromptsExample = ({ setValue }) =>
{
	const [prompts, setPrompts] = useState([]);
	const user = useSelector(selectUser);

	useEffect(() =>
	{
		(async () =>
		{
			await getExamples();
		})();
	}, []);

	const getExamples = async () =>
	{
		if (!user) return;
		
		const url = `/api/stella/prompt/examples?username=${encodeURIComponent(user.username)}&token=${user.token}`;

		try
		{
			const { data } = await ekosliveServer.get(url);
			setPrompts([...data.prompts]);
		}
		catch (error)
		{
			captureException(error);
			setPrompts([...sample_question]);
		}
	};

	return (
		<Grid
			id="stellaExample"
			container
			sx={{ justifyContent: "space-evenly", gap: "10px", position: "relative" }}
		>
			{prompts.map((prompt, idx) =>
			{
				return (
					<Grid
						sx={{
							display: "grid",
							placeItems: "center",
							borderRadius: "24px",
							backgroundColor: Palette.orange,
							padding: "16px",
							cursor: "pointer",
							gap: "10px",
							width: "calc((100% - 40px) / 3 - 30px)",
							maxWidth: "300px",
						}}
						item
						key={idx}
						onClick={() => setValue(prompt.prompt)}
					>
						<Typography sx={{ color: Palette.white }}>{prompt.prompt}</Typography>
					</Grid>
				);
			})}
			<IconButton
				onClick={getExamples}
				sx={{
					position: "absolute",
					right: "0px",
					top: "50%",
					transform: "translateY(-50%)",
					color: "#FFFFFF",
					textTransform: "none",
					borderRadius: "4px",
					height: "30px",
					width: "30px",
					padding: 0,
					backgroundColor: "#FFFCFA1F",
				}}
			>
				<RefreshIcon sx={{ color: Palette.white, fontSize: 20 }} />
			</IconButton>
		</Grid>
	);
};

export default PromptsExample;
