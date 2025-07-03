/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./landing-page/src/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/client/**/*.{js,jsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				white: "#FFFCFA",
				"white-primary": "#FFFFFF",
				"white-80": "#FFFFFFCC",
				"white-70": "#FFFFFFB3",
				"white-30": "#FFFFFF1E",
				"white-10": "#FFFFFF1A",
				"primary-orange": "#FF6600",
				"black-primary": "#000000",
				"black-secondary": "#171717",
				"grey-primary": "#E2E2E2",
			},
			fontFamily: {
				raleway: "Raleway",
				manrope: "Manrope",
				inter: "Inter",
				snasm: "snasm",
			},
			boxShadow: {
				"primary-btn": "0px 3px 49px 0px #FF660080",
				"secondary-btn": "0px 3px 49px 0px #FFFFFF80",
			},
			dropShadow: {
				about: "0px 0px 0px #FF6600",
			},
		},
		screens: {
			xs: "480px",
			sm: "640px",
			md: "768px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1440px",
		},
	},
	plugins: [],
};
