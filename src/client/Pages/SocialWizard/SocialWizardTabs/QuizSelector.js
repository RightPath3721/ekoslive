import React, { forwardRef, useImperativeHandle, useState } from "react";
import Image from "mui-image";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material";

const QuizSelector = forwardRef(({ options, question }, ref) =>
{
	const [value, setValue] = useState([]);
	const { palette } = useTheme();

	const handleChange = (_, newValue) =>
	{
		setValue(newValue);
	};

	useImperativeHandle(ref, () =>
	{
		return value;
	}, [value]);

	return (
		<Box
			display="flex"
			flexDirection="column"
			alignItems="flex-start"
			gap="1rem"
		>
			<Typography variant="h2">{question}</Typography>
			<ToggleButtonGroup
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(4, minmax(80px, 160px))",
					gap: ".5rem",
				}}
				value={value}
				onChange={handleChange}
			>
				{options.map((option) =>
				{
					return (
						<ToggleButton
							sx={{
								borderRadius: "4px !important",
								"&.Mui-selected": {
									backgroundColor: palette.primary.main,
									":hover": {
										backgroundColor: `${palette.primary.main}66`,
									},
								},
								":hover": {
									backgroundColor: `${palette.primary.main}66`,
								},
							}}
							key={option.value}
							value={option.value}
							aria-label={option.value}
						>
							<Box
								display="flex"
								flexDirection="column"
								gap=".5rem"
								alignItems="center"
								justifyContent="center"
							>
								<Image
									style={{
										objectFit: "contain",
										aspectRatio: 1,
										borderRadius: ".75rem",
										overflow: "hidden",
									}}
									src={option.src}
									width={120}
									height={120}
									alt={option.value}
									duration={0.7}
								/>
								<Typography variant="body2">{option.label}</Typography>
							</Box>
						</ToggleButton>
					);
				})}
			</ToggleButtonGroup>
		</Box>
	);
});

export default QuizSelector;
