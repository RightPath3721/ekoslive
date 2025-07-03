const tab = {
	styleOverrides: {
		root: ({ theme }) => ({
			padding: ".25rem .5rem",
			fontSize: ".75rem",
			minWidth: "45px",
			minHeight: "32px",
			[theme.breakpoints.up("sm")]: {
				fontSize: ".875rem",
				padding: ".75rem 1rem",
				minHeight: "48px",
			},
		}),
	},
};

export default tab;
