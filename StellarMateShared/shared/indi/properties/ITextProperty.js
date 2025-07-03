import { isEmpty } from "lodash";
import { IProperty } from "./IProperty";

export class ITextProperty extends IProperty
{
    constructor(prop)
    {
        super("INDI_TEXT", prop);
        this.state = prop.state;
        this.texts = this.parseTexts(prop.texts);
    }

    parseTexts = (texts) =>
    {
        const textsArr = [];
        // Iterate over all
        // append each property to this.properties
        texts.forEach((oneText) =>
        {
            const newText = {
                label: oneText.label,
                name: oneText.name,
                text: oneText.text,
                targetText: oneText.text
            };
            textsArr.push(newText);
        })
        return textsArr;
    }

    setElementValue = (element, text) =>
    {
        const IText = this.texts.find(oneText =>
        {
            return oneText.name === element
        });
        if (isEmpty(IText))
            return;
        IText.text = text;

    }

    setElementTargetValue = (element, text) =>
    {
        const IText = this.texts.find(oneText =>
        {
            return oneText.name === element
        });
        if (isEmpty(IText))
            return;
        IText.targetText = text;
    }

    toArray = () =>
    {
        return this.texts;
    }
}
