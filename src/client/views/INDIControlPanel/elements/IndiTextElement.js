import React, { memo } from "react";
import { TextField, Typography } from "@mui/material";
import { IPPerm } from "@indi/enums";
import { Palette } from "@common/shared/common/styles";

const IndiTextElement = ({ textElement, property, setInputText, inputTexts }) =>
    <>
        <Typography sx={[LOCAL_STYLES.element, { backgroundColor: Palette.grey33 }]}>{textElement.label}</Typography>

        {property.perm !== IPPerm.IP_WO ?
            <Typography sx={[LOCAL_STYLES.element]}>{textElement.text}</Typography>
            : null}

        {/* Show input field whenever it is not read only */}
        {property.perm !== IPPerm.IP_RO ?
            <TextField
                value={inputTexts[property.name] && inputTexts[property.name][textElement.name] !== undefined ?
                    `${inputTexts[property.name][textElement.name]}`
                    : `${textElement.text}`}
                sx={[LOCAL_STYLES.inputField]}
                InputProps={{
                    sx: {
                        color: "white", padding: 0, ".MuiInputBase-input": {
                            padding: "4px 12px"
                        },
                    },
                }}
                onChange={evt =>
                {
                    setInputText(property, textElement, evt.target.value)
                }}
                placeholder="Enter a value"
            />
            : null}
    </>

export default memo(IndiTextElement);

const LOCAL_STYLES = {
    inputField: {
        height: "30px",
        width: "120px",
        fontSize: "12px",
        padding: "2px",
    },
    element: {
        padding: "5px",
        border: `1px solid ${Palette.grey44}`,
        backgroundColor: Palette.grey33,
        borderRadius: "2px",
        textAlign: "left",
        fontSize: "12px",
        color: "white",
    },
};
