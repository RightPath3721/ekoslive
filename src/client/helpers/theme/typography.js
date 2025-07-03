import palette from "./palette";
import breakpoints from "./breakpoints";

const typography = {
	button: {
		textTransform: "capitalize",
	},
	fontFamily: "'Raleway'",
	allVariants: {
		fontFamily: "'Raleway', sans-serif",
		color: palette.white[900],
		fontWeight: 400,
	},
	fontWeightLight: 300,
	fontWeightRegular: 400,
	fontWeightMedium: 500,
	fontWeightBold: 700,
	h1: {
		fontSize: "1.5rem",
		fontWeight: 700,
		[`@media (min-width:${breakpoints.values.sm}px)`]: {
			fontSize: "2rem",
		},
		[`@media (min-width:${breakpoints.values.md}px)`]: {
			fontSize: "2.5rem",
		},
	},
	h2: {
		fontSize: "1rem",
		lineHeight: 1.3,
		fontWeight: 500,
		[`@media (min-width: ${breakpoints.values.md}px)`]: {
			fontSize: "1.25rem",
		},
	},
	h3: {
		fontSize: "1rem",
		lineHeight: 1.5,
		fontWeight: 600,
	},
	h4: {
		fontSize: ".75rem",
		[`@media (min-width: ${breakpoints.values.md}px)`]: {
			fontSize: ".875rem",
		},
	},
	body1: {
		fontSize: "1rem",
		lineHeight: 1.1,
	},
	body2: {
		fontSize: ".75rem",
		lineHeight: 1.5,
		[`@media (min-width: ${breakpoints.values.sm}px)`]: {
			fontSize: ".875rem",
		},
		[`@media (min-width: ${breakpoints.values.md}px)`]: {
			fontSize: ".9375rem",
		},
	},
	subtitle1: {
		fontSize: ".875rem",
		lineHeight: 1.5,
		fontWeight: 500,
	},
	subtitle2: {
		fontSize: ".875rem",
		lineHeight: 1.5,
	},
	caption: {
		fontSize: ".75rem",
	},
};

export default typography;
