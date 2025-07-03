const filledInput = {
	styleOverrides: {
		root: ({ theme }) => ({
			backgroundColor: theme.palette.black[700],
			color: theme.palette.common.white,
			borderRadius: "50px",
			padding: "0",
			width: "100%",
			"&.Mui-focused": {
				backgroundColor: theme.palette.black[700],
			},
			"&::before, &::after": {
				borderBottom: "transparent",
			},
			"&:hover": {
				backgroundColor: `${theme.palette.black[700]}99`,
			},
			"&.Mui-focused:after": {
				borderBottom: `2px solid ${theme.palette.common.white}`,
				borderRadius: "4px",
			},
			"::placeholder": {
				color: `${theme.palette.common.white}99`,
			},
			"::after": {
				right: "12px",
				left: "12px",
			},
		}),
		input: {
			padding: ".75rem 1rem",
		},
	},
};

export default filledInput;
