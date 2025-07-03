const button = {
	styleOverrides: {
		color: "white",
		root: ({ theme }) => ({
			backgroundColor: theme.palette.primary.main,
			color: theme.palette.common.white,
			borderRadius: "8px",
			"&.Mui-disabled": {
				opacity: ".7",
				cursor: "not-allowed",
				color: theme.palette.common.white,
			},
		}),
	},
	variants: [
		{
			props: { variant: "contained", disableRipple: false },
			style: ({ theme }) => ({
				backgroundColor: theme.palette.primary.main,
				color: theme.palette.common.white,
			}),
		},
		{
			props: { variant: "outlined" },
			style: ({ theme }) => ({
				backgroundColor: "transparent",
				color: theme.palette.common.white,
				":hover": {
					color: theme.palette.primary.main,
				},
			}),
		},
		{
			props: { variant: "text" },
			style: ({ theme }) => ({
				backgroundColor: "transparent",
				color: theme.palette.primary.main,
			}),
		},
	],
};

export default button;
