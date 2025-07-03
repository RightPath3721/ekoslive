import { isEmpty } from "lodash";

import { IDevice } from "./IDevice";
import { IPState, ISState } from "../enums";
import { indiActions } from "../../redux/actions";

export class Dome extends IDevice
{
    constructor(name, props, deviceType)
    {
        super(name, props, deviceType);
        this._canPark = null;
        this._parkProperty = null;
        this._canGoto = null;
        this._gotoProperty = null;
        this._hasShutter = null;
        this._canAbort = null;
        this._shutterProperty = null;
        this._domeSlavingToggle = null;
        this._domeParams = null;
        this._domeMeasurements = null;
    }

    canPark = () =>
    {
        return this.map.has("DOME_PARK");
    }

    canGoto = () =>
    {
        return this.map.has("ABS_DOME_POSITION");
    }

    canAbort = () =>
    {
        return this.map.has("DOME_ABORT_MOTION");
    }

    abort = () =>
    {
        const property = this.map.get("DOME_ABORT_MOTION");
        if (isEmpty(property))
            return { type: "", payload: "" };
        property.setElementTargetValue("ABORT");
        return indiActions.sendNewSwitches(this.name, property.name, property.switches);
    }

    hasShutter = () =>
    {
        return this.map.has("DOME_SHUTTER");
    }

    isShutterOpen = () =>
    {
        if (this.hasShutter() === false)
            return false;
        return this.map.get("DOME_SHUTTER").getOnSwitchIndex() === 0;
    }

    /**
     *
     * @param open True to open shutter, false to close shutter
     * @returns Redux action that must be dispatched to execute the operation on INDI server.
     */
    toggleShutter = (open) =>
    {
        const property = this.map.get("DOME_SHUTTER");
        if (isEmpty(property))
            return { type: "", payload: "" };
        property.setElementTargetValue(open ? "SHUTTER_OPEN" : "SHUTTER_CLOSE");
        return indiActions.sendNewSwitches(this.name, property.name, property.switches);
    }

    isSlaved = () =>
    {
        const property = this.map.get("DOME_AUTOSYNC");
        if (property)
            return property.getOnSwitchIndex() === 0;
        return false;
    }

    // Return redux action that needs to be dispatch to toggle dome slaving
    toggleSlaving = (enable) =>
    {
        const property = this.map.get("DOME_AUTOSYNC");
        if (!property)
            return { type: "", payload: "" };

        property.setElementTargetValue(enable ? "DOME_AUTOSYNC_ENABLE" : "DOME_AUTOSYNC_DISABLE");
        return indiActions.sendNewSwitches(this.name, property.name, property.switches);
    }

    getAutoSyncThreshold = () =>
    {
        const property = this.map.get("DOME_PARAMS");
        if (property)
        {
            const element = property.getElement("AUTOSYNC_THRESHOLD");
            if (element)
                return element.value;
        }
        return NaN;
    }

    // Return redux action that needs to be dispatched
    setAutoSyncThreshold = (value) =>
    {
        const property = this.map.get("DOME_PARAMS");
        if (isEmpty(property))
            return { type: "", payload: "" };
        property.setElementTargetValue("AUTOSYNC_THRESHOLD", value);
        return indiActions.sendNewNumbers(this.name, property.name, property.numbers);
    }

    getAzimuth = () =>
    {
        const property = this.map.get("ABS_DOME_POSITION");
        if (property)
        {
            const element = property.getElement("DOME_ABSOLUTE_POSITION");
            if (element)
                return element.value;
        }
        return NaN;
    }

    // Return redux action that needs to be dispatched
    gotoAzimuth = (value) =>
    {
        const property = this.map.get("ABS_DOME_POSITION");
        if (isEmpty(property))
            return { type: "", payload: "" };
        property.setElementTargetValue("DOME_ABSOLUTE_POSITION", value);
        return indiActions.sendNewNumbers(this.name, property.name, property.numbers);
    }

    getDomeMeasurements = () =>
    {
        const property = this.map.get("DOME_MEASUREMENTS");
        if (!isEmpty(property))
            return {
                radius: property.numbers[0].value,
                shutter_width: property.numbers[1].value,
                n_displacement: property.numbers[2].value,
                e_displacement: property.numbers[3].value,
                up_displacement: property.numbers[4].value,
                ota_offset: property.numbers[5].value
            }
        return {
            radius: 0,
            shutter_width: 0,
            n_displacement: 0,
            e_displacement: 0,
            up_displacement: 0,
            ota_offset: 0
        };
    }

    setDomeMeasurements = (values) =>
    {
        const property = this.map.get("DOME_MEASUREMENTS");
        if (!isEmpty(property))
            return { type: "", payload: "" }
        property.setElementTargetValue("DM_DOME_RADIUS", values[0]);
        property.setElementTargetValue("DM_SHUTTER_WIDTH", values[1]);
        property.setElementTargetValue("DM_NORTH_DISPLACEMENT", values[2]);
        property.setElementTargetValue("DM_EAST_DISPLACEMENT", values[3]);
        property.setElementTargetValue("DM_UP_DISPLACEMENT", values[4]);
        property.setElementTargetValue("DM_OTA_OFFSET", values[5]);
        return indiActions.sendNewNumbers(this.name, property.name, property.numbers);
    }

    isParked = () =>
    {
        const property = this.map.get("DOME_PARK");
        if (property)
        {
            // We are parked if state is IDLE or OK and PARKED is ON.
            return (property.state <= IPState.IPS_OK && property.switches[0].state === ISState.ISS_ON)
        }

        return false;
    }

    togglePark = (park) =>
    {
        const property = this.map.get("DOME_PARK");
        if (!property)
            return { type: "", payload: "" }

        property.setElementTargetValue(park ? "PARK" : "UNPARK");
        return indiActions.sendNewSwitches(this.name, property.name, property.switches);
    }
}
