import React, { memo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import INDIProperty from "./properties/INDIProperty";
import { IPState } from "@indi/enums";
import { styles } from "../../shared/styles";
import { Palette } from "@common/shared/common/styles";

const INDIProperties = ({ properties, inputNumbers, inputTexts, setInputText, setInputNumberValue, sendNewElement }) =>
    <Box sx={[styles.verticalScrollBar, {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignItems: "flex-start",
        height: "500px",
        overflowY: "scroll",
        padding: "8px",
    }]}>
        {/* Loops over the groups properties and renders each property */}
        {properties.map((property, index) => <Box key={index} sx={{
            display: "grid",
            gridTemplateColumns: "160px auto",
            alignItems: "center",
            gap: "6px",
        }}
        >
            <Typography
                sx={[LOCAL_STYLES.propertyLabel, styles.text, handlePropertyStateLight(property.state)]}>{property.label}</Typography>
            {/* renders the property based on its type: text, number, switch or light  */}
            <INDIProperty property={property} inputNumbers={inputNumbers} inputTexts={inputTexts}
                sendNewElement={sendNewElement}
                setInputText={setInputText} setInputNumberValue={setInputNumberValue} />
        </Box>
        )}
    </Box>

const handlePropertyStateLight = (state) =>
{
    if (state === IPState.IPS_IDLE)
        return { borderColor: Palette.grey99 }
    if (state === IPState.IPS_OK)
        return { borderColor: "#228B22" }
    if (state === IPState.IPS_BUSY)
        return { borderColor: "yellow" }
    if (state === IPState.ALERT)
        return { borderColor: "#DC143C" }
};

const LOCAL_STYLES =
{
    propertyLabel: {
        fontSize: "15px",
        border: `2px solid ${Palette.grey33}`,
        borderRadius: "2px",
        padding: "4px 0px 4px 4px",
    }
};

export default memo(INDIProperties);
