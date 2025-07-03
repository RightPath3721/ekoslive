import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../helpers/theme";

const Theme = ({ children }) =>
{
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default Theme;
