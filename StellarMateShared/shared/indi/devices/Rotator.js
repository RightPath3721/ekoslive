import { IDevice } from "./IDevice";
import { indiActions } from "../../redux/actions";

export class Rotator extends IDevice
{
    constructor(name, props, deviceType)
    {
        super(name, props, deviceType);
    }

    getAngle = () =>
    {
        const property = this.map.get("ABS_ROTATOR_ANGLE");
        if (property)
            return property.numbers[0].value;
        else
            throw (`Absolute rotator position property not found in ${this.name}`);
    }

    setAngle = (angle) =>
    {
        const property = this.map.get("ABS_ROTATOR_ANGLE");
        if (property)
        {
            property.setElementTargetValue("ANGLE", angle);
            return indiActions.sendNewNumbers(this.name, property.name, property.numbers);
        } else
            throw (`Absolute rotator position property not found in ${this.name}`);
    }

    stop = () =>
    {
        const property = this.map.get("ROTATOR_ABORT_MOTION");
        if (property)
        {
            property.setElementTargetValue("ABORT");
            return indiActions.sendNewSwitches(this.name, property.name, property.switches);
        } else
            throw (`Rotator abort property not found in ${this.name}`);
    }

    setReversedDirection = (enabled) =>
    {
        const property = this.map.get("ROTATOR_REVERSE");
        if (property)
        {
            property.setElementTargetValue(enabled ? "INDI_ENABLED" : "INDI_DISABLED");
            return indiActions.sendNewSwitches(this.name, property.name, property.switches);
        } else
            throw (`Rotator reverse property not found in ${this.name}`);
    }

    isReversed = () =>
    {
        const property = this.map.get("ROTATOR_REVERSE");
        if (property)
            return property.getOnSwitchIndex() == 0;
        else
            throw (`Rotator reverse property not found in ${this.name}`);
    }
}
