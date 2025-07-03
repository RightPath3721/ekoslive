const iconButton = {
	styleOverrides: {
		root: ({ theme }) => ({
			padding: ".25rem",
			[theme.breakpoints.up("md")]: {
				padding: ".5rem",
			},
		}),
	},
};

export default iconButton;
