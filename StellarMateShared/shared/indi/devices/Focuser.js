import { IDevice } from "./IDevice";
import { indiActions } from "../../redux/actions";
import { IPPerm } from "../enums";

export class Focuser extends IDevice
{
    constructor(name, props, deviceType)
    {
        super(name, props, deviceType);
        this._canCool = null;
        this._angle = null;
        this._hasRotator = null;
    }

    isAbsoluteFocuser = () =>
    {
        return this.map.has("ABS_FOCUS_POSITION");
    };

    getPosition = () =>
    {
        let property = this.map.get("ABS_FOCUS_POSITION");
        if (property) return property.numbers[0].value;
        else
        {
            property = this.map.get("REL_FOCUS_POSITION");
            if (property) return property.numbers[0].value;
            else throw `Absolute focus position property not found in ${this.name}`;
        }
    };

    setPosition = (steps) =>
    {
        let property = this.map.get("ABS_FOCUS_POSITION");
        if (property)
        {
            property.setElementTargetValue("FOCUS_ABSOLUTE_POSITION", steps);
            return indiActions.sendNewNumbers(
                this.name,
                property.name,
                property.numbers,
            );
        }
        else
        {
            property = this.map.get("REL_FOCUS_POSITION");
            if (property)
            {
                property.setElementTargetValue("FOCUS_RELATIVE_POSITION", steps);
                return indiActions.sendNewNumbers(
                    this.name,
                    property.name,
                    property.numbers,
                );
            }
            else throw `Absolute focus position property not found in ${this.name}`;
        }
    };

    hasRotator = () =>
    {
        if (this._hasRotator == null)
        {
            this._angle = this.getElement("ABS_ROTATOR_ANGLE", "ANGLE");
            this._hasRotator = this._angle !== null;
        }

        return this._hasRotator;
    };

    getAngle = () =>
    {
        if (this.hasRotator()) return this._angle.value;
        else return null;
    };

    setAngle = (angle) =>
    {
        this._angle.value = angle;
    };

    canCool = () =>
    {
        // #1 Find property with name FOCUSER_TEMPERATURE
        // #2 Make sure property RW (perm: 2)
        if (this._canCool === null)
        {
            const temperature = this.getProperty("FOCUS_TEMPERATURE");
            if (temperature)
            {
                this._canCool = temperature.perm === IPPerm.IP_RW;
            }
            else this._canCool = false;
        }

        return this._canCool;
    };
}
