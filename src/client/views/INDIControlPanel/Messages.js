import { isEmpty, isEqual } from "lodash";
import React from "react";
import { useSelector } from "react-redux";
import { Palette } from "@common/shared/common/styles";
import { getINDIMessages } from "@redux/selectors";
import { Box } from "@mui/material";

const Messages = ({selectedDevice}) => 
{
    const logs = useSelector(state => getINDIMessages(state), isEqual);

    return(
        <Box style={{borderWidth: 1, borderColor: Palette.grey44, height: "120px", }}>
        {!isEmpty(logs) && !isEmpty(selectedDevice) &&
        <Box style={{padding: "6px", marginBottom: "6px"}}>
        </Box>
        }
        </Box>
    )
}

export default Messages;