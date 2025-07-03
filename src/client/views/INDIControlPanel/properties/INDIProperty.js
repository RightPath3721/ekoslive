import React, { memo } from "react";

import INDITextProperty from "./INDITextProperty";
import INDINumberProperty from "./INDINumberProperty";
import INDISwitchProperty from "./INDISwitchProperty";
import INDILightProperty from "./INDILightProperty";

const INDIProperty = ({ property, inputTexts, inputNumbers, setInputText, setInputNumberValue, sendNewElement }) =>
{
    if (property.texts)
        return <INDITextProperty inputTexts={inputTexts} sendNewElement={sendNewElement} property={property}
            setInputText={setInputText} />

    else if (property.numbers)
        return <INDINumberProperty inputNumbers={inputNumbers} setInputNumberValue={setInputNumberValue}
            property={property} sendNewElement={sendNewElement} />

    else if (property.switches)
    {
        return <INDISwitchProperty property={property} sendNewElement={sendNewElement} />

    } else if (property.lights)
        return <INDILightProperty lights={property.lights} />

}

export default memo(INDIProperty);
