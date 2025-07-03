import { IDevice } from "./IDevice";
import { IPState, ISState } from "../enums";
import { indiActions } from "../../redux/actions";

export class DustCap extends IDevice
{
    constructor(name, props, deviceType)
    {
        super(name, props, deviceType);
    }

    isParked = () =>
    {
        const property = this.map.get("CAP_PARK");
        if (property)
        {
            // We are parked if state is IDLE or OK and PARKED is ON.
            return (property.state <= IPState.IPS_OK && property.switches[0].state === ISState.ISS_ON)
        }

        return false;
    }

    togglePark = (park) =>
    {
        const property = this.map.get("CAP_PARK");
        if (!property)
            return { type: "", payload: "" }

        property.setElementTargetValue(park ? "PARK" : "UNPARK");
        return indiActions.sendNewSwitches(this.name, property.name, property.switches);
    }
}