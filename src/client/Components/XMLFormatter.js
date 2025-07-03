import React from "react";
import XMLViewer from "react-xml-viewer";
import Box from "@mui/material/Box";
import { Palette } from "@common/shared/common/styles";
import { styles } from "../shared/styles";

const customTheme = {
    separatorColor: Palette.white50,
    textColor: Palette.white,
    fontFamily: "\"Roboto\", \"Helvetica\", \"Arial\", sans-serif",
};

const XMLFormatter = ({ xml, collapsible = true }) =>
{
    return (
        <Box sx={[styles.verticalScrollBar, LOCAL_STYLES.contentWrapper]}>
            <XMLViewer collapsible={collapsible} xml={xml} theme={customTheme} />
        </Box>
    );
};

const LOCAL_STYLES = {
    contentWrapper: {
        color: "white",
        height: "520px",
        paddingBlock: "6px",
        overflowY: "scroll",
    },
};

export default XMLFormatter