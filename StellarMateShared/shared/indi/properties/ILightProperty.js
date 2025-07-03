import { IProperty } from "./IProperty"

export class ILightProperty extends IProperty
{
    constructor(prop)
    {
        super("INDI_LIGHT", prop);
        this.state = prop.state;
        this.lights = this.parseLights(prop.lights);
    }

    parseLights = (lights) =>
    {
        const lightsArr = [];
        // Iterate over all
        // append each property to this.properties
        lights.forEach((oneLight) =>
        {
            const newLight = {
                label: oneLight.label,
                name: oneLight.name,
                state: oneLight.state,
            };
            lightsArr.push(newLight);
        })
        return lightsArr;
    }

    setTargetElementValue = (element, value) =>
    {
        for (const oneLight of this.lights)
        {
            if (oneLight.name === element)
                oneLight.targetState = value;
        }
    }

}
