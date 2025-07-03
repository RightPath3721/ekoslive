const Switch = {
	styleOverrides: {
		thumb: ({ theme, checked }) => ({
			backgroundColor: theme.palette.common.white,
			boxShadow: "0px 1px 3px 0px #1018281A",
			width: 17,
			height: 17,
			margin: checked ? "2px 2px 2px 0px" : "2px 0px 2px 2px",
		}),
		root: {
			borderRadius: "12px",
			padding: "2px",
			width: 44,
			height: 24,
		},
		track: ({ theme, checked }) => ({
			backgroundColor: checked
				? theme.palette.primary.main
				: theme.palette.grey[100],
			opacity: 1,
			borderRadius: "12px",
		}),
		switchBase: {
			"&.Mui-checked+.MuiSwitch-track": {
				opacity: 1,
			},
			padding: "2px",
		},
	},
};

export default Switch;
