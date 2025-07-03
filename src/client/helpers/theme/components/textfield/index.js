const textfield = {
	styleOverrides: {
		root: ({ theme }) => ({
			"--TextField-brandBorderColor": "transparent",
			"--TextField-brandBorderHoverColor": "transparent",
			"--TextField-brandBorderFocusedColor": "transparent",
			borderColor: "transparent",
			"& label.Mui-focused": {
				color: theme.palette.common.white,
			},
			color: theme.palette.common.white,
			backgroundColor: theme.palette.black[700],
			borderRadius: "4px",
			"& .MuiInputLabel-root": {
				color: theme.palette.common.white,
			},
			"& .MuiInputBase-root": {
				color: theme.palette.common.white,
				caretColor: theme.palette.primary.main,
			},
		}),
	}
};

export default textfield;
