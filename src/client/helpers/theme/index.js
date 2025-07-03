import { createTheme, responsiveFontSizes } from "@mui/material/styles";
// core
import typography from "./typography";
import breakpoints from "./breakpoints";
// components
import button from "./components/button/button";
import iconButton from "./components/button/iconbutton";
import muiTypography from "./components/typography";
import paper from "./components/paper";
import textfield from "./components/textfield";
import outlinedInput from "./components/input/outlinedInput";
import filledInput from "./components/input/filledInput";
import input from "./components/input/input";
import checkbox from "./components/checkbox";
import linearProgress from "./components/linearProgress";
import Switch from "./components/switch";
import palette from "./palette";
import modal from "./components/modal";
import breadcrumbs from "./components/breadcrumbs";
import tabs from "./components/tabs/tabs";
import tab from "./components/tabs/tab";
import formControlLabel from "./components/formControlLabel";

const theme = createTheme({
	components: {
		MuiButton: button,
		MuiTypography: muiTypography,
		MuiPaper: paper,
		MuiTextField: textfield,
		MuiOutlinedInput: outlinedInput,
		MuiFilledInput: filledInput,
		MuiInput: input,
		MuiCheckbox: checkbox,
		MuiLinearProgress: linearProgress,
		MuiSwitch: Switch,
		MuiModal: modal,
		MuiBreadcrumbs: breadcrumbs,
		MuiTab: tab,
		MuiTabs: tabs,
		MuiIconButton: iconButton,
		MuiFormControlLabel: formControlLabel,
	},
	typography,
	palette,
	breakpoints,
});

export default responsiveFontSizes(theme);
