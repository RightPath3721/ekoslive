import { Palette } from "@common/shared/common/styles";

// use window to get application's windth/height in device
const longerSide = Math.max(window.innerWidth, window.innerHeight);
const shorterSide = Math.min(window.innerWidth, window.innerHeight);

export const px = Math.min(
	window.innerWidth / longerSide,
	window.innerHeight / shorterSide,
);
export const AspectRatio = window.innerWidth / window.innerHeight;

export const styles = {
	row: {
		display: "flex",
		flexDirection: "row",
	},
	text: {
		color: "#CECECE",
	},
	center: {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},
	f1: {
		flex: 1,
	},
	f2: {
		flex: 2,
	},
	f3: {
		flex: 3,
	},
	f4: {
		flex: 4,
	},
	h1: {
		fontWeight: "bold",
		fontSize: "32px",
	},
	h2: {
		fontWeight: "bold",
		fontSize: "24px",
	},
	centerAbsolute: {
		position: "absolute",
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)",
	},
	relativeContainer: {
		position: "relative",
		minHeight: "100vh", // Ensure enough space for both absolute positioned and normal flow elements
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
	},
	verticalScrollBar: {
		"::-webkit-scrollbar": {
			width: "4px",
		},
		"::-webkit-scrollbar-track": {
			WebkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
		},
		"::-webkit-scrollbar-thumb": {
			backgroundColor: "rgba(0,0,0,.1)",
			outline: `1px solid ${Palette.grey44}`,
		},
	},
	horizontalScrollBar: {
		"::-webkit-scrollbar": {
			height: "8px",
			width: "0.5px",
			background: "#222222",
		},
		"::-webkit-scrollbar-thumb:horizontal": {
			background: "transparent",
			paddingBlock: "1px",
			border: `1px solid ${Palette.grey44}`,
		},
	},
};

export const navContainerTheme = {
	colors: {
		primary: "#136",
	},
};

export const textFieldStyles = {
	"& .MuiInputLabel-root": {
		color: Palette.white,
	},
	"& .MuiInputBase-root": {
		color: Palette.white,
	},
	"& .MuiOutlinedInput-root": {
		"& fieldset": {
			borderColor: "#E0E3E7",
		},
		"&:hover fieldset": {
			borderColor: Palette.orange,
		},
		"&.Mui-focused fieldset": {
			borderColor: Palette.orange,
		},
	},
	"& .MuiFormHelperText-root": {
		color: Palette.orange,
	},
	"& label.Mui-focused": {
		color: Palette.orange,
	},
	"& .MuiAutocomplete-clearIndicator": {
		color: Palette.white,
	},
	"& .MuiAutocomplete-popupIndicator": {
		color: Palette.white,
	},
	"& .MuiChip-deleteIcon": {
		color: Palette.grey99 + " !important",
	},
	"& .MuiAutocomplete-option": {
		color: Palette.white,
	},
	"& .MuiAutocomplete-noOptions": {
		color: Palette.white,
	},
};
