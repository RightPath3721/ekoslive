import { isEmpty } from "lodash";
import { IProperty } from "./IProperty"
import { ISRule, ISState } from "../enums";

export class ISwitchProperty extends IProperty
{
    constructor(prop)
    {
        super("INDI_SWITCH", prop);
        this.rule = prop.rule;
        this.state = prop.state;
        this.switches = this.parseSwitches(prop.switches);
    }

    parseSwitches = (switches) =>
    {
        let switchesArr = [];
        // Iterate over all
        // append each property to this.properties
        switches.forEach((oneSwitch) =>
        {
            const newSwitch = {
                label: oneSwitch.label,
                name: oneSwitch.name,
                state: oneSwitch.state,
                targetState: oneSwitch.state
            };
            switchesArr.push(newSwitch);
        })
        return switchesArr;
    }

    getRangeList = () =>
    {
        let rangeList = [];
        this.switches.forEach((oneSwitch) =>
        {
            rangeList.push(oneSwitch.label);
        });

        return rangeList;
    }

    toArray = () =>
    {
        return this.switches;
    }

    setElementValue = (element, state) =>
    {
        const ISwitch = this.switches.find(oneSwitch =>
        {
            return oneSwitch.name === element
        });
        if (isEmpty(ISwitch))
            return;
        ISwitch.state = state;

    }

    setAtMostOne = (element) =>
    {
        this.switches.forEach(oneSwitch =>
        {
            if (oneSwitch.name === element)
                oneSwitch.targetState = oneSwitch.state ? ISState.ISS_OFF : ISState.ISS_ON;
            else
                oneSwitch.targetState = ISState.ISS_OFF;
        }
        )
    }

    setOneOfMany = (element) =>
    {
        this.switches.forEach(oneSwitch =>
        {
            if (oneSwitch.name === element)
                oneSwitch.targetState = ISState.ISS_ON;
            else
                oneSwitch.targetState = ISState.ISS_OFF;
        }
        )
    }

    setNMany = (element) =>
    {
        this.switches.forEach(oneSwitch =>
        {
            if (oneSwitch.name === element)
                oneSwitch.targetState = oneSwitch.state ? ISState.ISS_OFF : ISState.ISS_ON;
        }
        )
    }

    setElementTargetValue = (element) =>
    {
        if (this.rule === ISRule.ISR_ATMOST1)
            this.setAtMostOne(element);
        if (this.rule === ISRule.ISR_1OFMANY)
            this.setOneOfMany(element);
        if (this.rule === ISRule.ISR_NMANY)
            this.setNMany(element);
    }

    getOnSwitchIndex = () =>
    {
        return this.switches.findIndex(oneSwitch => oneSwitch.state === ISState.ISS_ON);
    }

    getOnSwitchName = () =>
    {
        const oneSwitch = this.switches.find(oneSwitch => oneSwitch.state === ISState.ISS_ON);
        if (oneSwitch)
            return oneSwitch.name;
        else
            return null;
    }

    getOnSwitchLabel = () =>
    {
        const oneSwitch = this.switches.find(oneSwitch => oneSwitch.state === ISState.ISS_ON);
        if (oneSwitch)
            return oneSwitch.label;
        else
            return null;
    }

    reset = () =>
    {
        this.switches.forEach(oneSwitch =>
            oneSwitch.targetState = ISState.ISS_OFF);
    }
}
