import { EmptyAction } from "../../common/common";
import { indiActions } from "../../redux/actions";
import { IDevice } from "./IDevice"

export class Guider extends IDevice
{
    constructor(name, props, deviceType)
    {
        super(name, props, deviceType);
    }

    /**
     * Set Manual Pulse for Guider
     * @param {*} duration 1000ms 
     * @param {*} direction North / South / West / East i.e TELESCOPE_TIMED_GUIDE_NS
     * @param {*} name Target name that's need to be updated i.e TIMED_GUIDE_N
     * @returns Updates INDI Driver property
     */
    setManualPulse = (duration, direction, name) =>
    {
        const property = this.map.get(direction);
        if (property)
        {
            property.setElementTargetValue(name, duration);
            return indiActions.sendNewNumbers(
                this.name,
                property.name,
                property.numbers,
            );
        }
        return EmptyAction;
    };
}
