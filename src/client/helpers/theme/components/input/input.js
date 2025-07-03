const input = {
	styleOverrides: {
		root: {
			"&::before": {
				borderBottom: "2px solid var(--TextField-brandBorderColor)",
			},
			"&:hover:not(.Mui-disabled, .Mui-error):before": {
				borderBottom: "2px solid var(--TextField-brandBorderHoverColor)",
			},
			"&.Mui-focused:after": {
				borderBottom: "2px solid var(--TextField-brandBorderFocusedColor)",
			},
			fontVariantNumeric: "lining-nums",
		},
	},
};

export default input;
