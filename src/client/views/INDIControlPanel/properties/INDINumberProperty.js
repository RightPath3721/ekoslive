import React, { memo } from "react";
import { Box, Button } from "@mui/material";
import IndiNumberElement from "../elements/IndiNumberElement";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import { IPPerm } from "@indi/enums";

const INDINumberProperty = ({ property, setInputNumberValue, inputNumbers, sendNewElement }) =>
{
    return <Box sx={{
        display: "grid",
        gridTemplateColumns: "160px 160px 120px auto",
        gap: "4px",
    }}>
        {property.numbers.map((numberElement, index) =>
        {
            return <IndiNumberElement numberElement={numberElement} property={property}
                setInputNumberValue={setInputNumberValue}
                inputNumbers={inputNumbers} key={index} />
        })}

        {property.perm !== IPPerm.IP_RO &&
            <Button
                sx={[LOCAL_STYLES.setBtn, property.numbers.length > 1 ? {
                    gridColumn: 4,
                    gridRow: `1 / ${property.numbers.length + 1}`,
                } : null]}
                onClick={() =>
                {
                    if (!property.numbers || !Array.isArray(property.numbers)) return;

                    // we check for each  number element if we have changed anything in their fields
                    property.numbers.forEach((number) =>
                    {
                        if (inputNumbers[property.name] && inputNumbers[property.name][number.name] !== undefined)
                            property.setElementTargetValue(number.name, inputNumbers[property.name][number.name]);
                    })
                    sendNewElement(property);
                }}
            >
                {s.general.set}
            </Button>
        }
    </Box >
};

const LOCAL_STYLES =
{
    setBtn: {
        backgroundColor: Palette.grey33,
        border: `1px solid ${Palette.grey99}`,
        width: "auto",
        fontSize: "12px",
        fontWeight: "bold",
        color: Palette.greyee,
        maxWidth: "100px",
        textTransform: "none",
    },
};

export default memo(INDINumberProperty);