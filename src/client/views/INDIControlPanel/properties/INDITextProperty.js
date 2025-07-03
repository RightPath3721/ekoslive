import React, { memo } from "react";
import { Box, Button } from "@mui/material";
import INDITextElement from "../elements/IndiTextElement";
import { Palette } from "@common/shared/common/styles";
import { IPPerm } from "@indi/enums";
import s from "@common/shared/i18n/i18n";

const INDITextProperty = ({ property, sendNewElement, inputTexts, setInputText }) =>
{
    return <Box sx={{
        display: "grid",
        gridTemplateColumns: property.perm !== IPPerm.IP_RO ? "repeat(2, 160px) 120px auto" : "180px 1fr",
        gap: "4px",
    }}>
        {property.texts.map((textElement, index) =>
            <INDITextElement key={index} textElement={textElement} property={property} setInputText={setInputText}
                inputTexts={inputTexts} />
        )}

        {property.perm !== IPPerm.IP_RO &&
            <Button
                sx={[LOCAL_STYLES.setBtn, { gridColumn: "4", gridRow: `1 / ${property.texts.length + 1}` }]}
                onClick={() =>
                {
                    if (!property.texts || !Array.isArray(property.texts)) return;
                    // we check for each text element if we have changed anything in their fields
                    property.texts.forEach((textElement) =>
                    {
                        if (inputTexts[property.name] && inputTexts[property.name][textElement.name])
                            property.setElementTargetValue(textElement.name, inputTexts[property.name][textElement.name]);
                    })
                    sendNewElement(property);
                }}
            >
                {s.general.set}
            </Button>
        }
    </Box>
}

export default memo(INDITextProperty);

const LOCAL_STYLES = {
    setBtn: {
        backgroundColor: Palette.grey33,
        border: `1px solid ${Palette.grey99}`,
        width: "auto",
        fontSize: "12px",
        fontWeight: "bold",
        color: Palette.greyee,
        maxWidth: "100px",
    },
};
