import { List, ListItemButton, ListItemText } from "@mui/material";
import { isEmpty } from "lodash";
import React from "react";
import { styles } from "../shared/styles";
import { Palette } from "@common/shared/common/styles";

const Settings = ({setSettings, data, currentSettings}) => 
{
    let settings = isEmpty(currentSettings) ? data[0] : currentSettings;
    return(
        <List
        // sx={{ width: '100%', maxWidth: 360, bgcolor: '#1d1d1d' }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        >
            <ListItemText sx={[styles.text, {paddingLeft: "16px", opacity: "50%", marginBottom: "16px"}]}>SETTINGS</ListItemText>
        { data.map((oneData) => 
        {
            return(
            <ListItemButton 
            sx={{backgroundColor: (oneData === settings) ? Palette.orange : "",
            "&:hover": {backgroundColor: (oneData === settings) ? Palette.orange : "" }
            }} 
            onClick={() => setSettings(oneData)}
            key={oneData}>
                <ListItemText sx={styles.text}>{oneData}</ListItemText>
            </ListItemButton>)
                    })
        }
        </List>
    )
}

export default Settings;