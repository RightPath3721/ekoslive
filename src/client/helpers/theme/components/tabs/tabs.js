const tabs = {
	styleOverrides: {
		root: ({ theme }) => ({
			minHeight: "32px",
			[theme.breakpoints.up("sm")]: {
				minHeight: "48px",
			},
		}),
	},
};

export default tabs;
