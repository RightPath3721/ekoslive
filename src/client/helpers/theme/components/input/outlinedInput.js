import { outlinedInputClasses } from "@mui/material";

const outlinedInput = {
	styleOverrides: {
		notchedOutline: {
			borderColor: "var(--TextField-brandBorderColor)",
		},
		root: ({ theme }) => ({
			[`&:hover .${outlinedInputClasses.notchedOutline}`]: {
				borderColor: "var(--TextField-brandBorderHoverColor)",
			},
			[`&.Mui-focused .${outlinedInputClasses.notchedOutline}`]: {
				borderColor: "var(--TextField-brandBorderFocusedColor)",
			},
			color: theme.palette.common.white,
		}),
	},
};

export default outlinedInput;
