import { isEmpty } from "lodash";
import { IProperty } from "./IProperty";

export class INumberProperty extends IProperty
{
    constructor(prop)
    {
        super("INDI_NUMBER", prop);
        this.state = prop.state;
        this.numbers = this.parseNumbers(prop.numbers);
    }

    parseNumbers = (numbers) =>
    {
        let numbersArr = [];
        // Iterate over all
        // append each property to this.properties
        numbers.forEach((oneNumber) =>
        {
            const newNumber = {
                label: oneNumber.label,
                name: oneNumber.name,
                min: oneNumber.min,
                max: oneNumber.max,
                step: oneNumber.step,
                value: oneNumber.value,
                targetValue: oneNumber.value,
                format: oneNumber.format
            };
            numbersArr.push(newNumber);
        })
        return numbersArr;
    }

    getMinMaxStep = (element) =>
    {
        const INumber = this.numbers.find(oneNumber =>
        {
            return oneNumber.name === element
        });
        if (isEmpty(INumber))
            return [];

        return [INumber.min, INumber.max, INumber.step];
    }

    getRangeList = (element) =>
    {
        let [min, max, step] = this.getMinMaxStep(element);
        // We cannot create list for steps = 0
        if (step === undefined || step === 0)
            return [];

        // Limit them to 30 steps to fit in App.
        if ((max - min) / step > 30)
            step = (max - min) / 30;

        // Include Min / Max in array as they are
        // Then include everything in between.
        let i;
        let rangeList = [min];
        for (i = min + step; i < max; i += step)
        {
            rangeList.push(i);
        }
        // Make sure we didn't exceed max. If we did, pop the last value
        if (rangeList[rangeList.length - 1] >= max)
            rangeList.pop();

        rangeList.push(max);
        return rangeList;
    }

    setElementValue = (element, value) =>
    {
        const INumber = this.numbers.find(oneNumber =>
        {
            return oneNumber.name === element
        });
        if (isEmpty(INumber))
            return;

        const numberValue = Number(value);
        // Check if number can be formatted as double.
        INumber.value = numberValue ? numberValue : value;

    }

    setElementTargetValue = (element, value) =>
    {
        const INumber = this.numbers.find(oneNumber =>
        {
            return oneNumber.name === element
        });
        if (isEmpty(INumber))
            return;

        const numberValue = Number(value);
        // Check if number can be formatted as double.
        INumber.targetValue = numberValue ? numberValue : value;

    }

    toArray = () =>
    {
        return this.numbers;
    }
}