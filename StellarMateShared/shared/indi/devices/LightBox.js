import { isEmpty } from "lodash";
import { IDevice } from "./IDevice";
import { IPState, ISState } from "../enums";
import { indiActions } from "../../redux/actions";
import { EmptyAction } from "../../common/common";

export class LightBox extends IDevice
{
	constructor(name, props, deviceType)
	{
		super(name, props, deviceType);
		this._hasIntensity = null;
	}

	// Check if the lightbox has intensity control
	hasIntensity = () =>
	{
		if (this._hasIntensity === null)
		{
			this._hasIntensity = !isEmpty(this.getProperty("FLAT_LIGHT_INTENSITY"));
		}

		return this._hasIntensity;
	};

	// Get the current intensity value
	getIntensity = () =>
	{
		const property = this.map.get("FLAT_LIGHT_INTENSITY");
		if (property)
		{
			const intensityElement = property.numbers.find(
				(num) => num.name === "FLAT_LIGHT_INTENSITY_VALUE",
			);
			if (intensityElement)
			{
				return intensityElement.value;
			}
		}
		return 0;
	};

	// Set the intensity value
	setIntensity = (value) =>
	{
		const property = this.map.get("FLAT_LIGHT_INTENSITY");
		if (!property) return EmptyAction;

		property.setElementTargetValue("FLAT_LIGHT_INTENSITY_VALUE", value);
		return indiActions.sendNewNumbers(
			this.name,
			property.name,
			property.numbers,
		);
	};

	// Check if the light is on
	isLightOn = () =>
	{
		const property = this.map.get("FLAT_LIGHT_CONTROL");
		if (property)
		{
			const onElement = property.switches.find(
				(sw) => sw.name === "FLAT_LIGHT_ON",
			);
			if (onElement)
			{
				return onElement.state === ISState.ISS_ON;
			}
		}
		return false;
	};

	// Toggle the light on/off
	toggleLight = (on) =>
	{
		const property = this.map.get("FLAT_LIGHT_CONTROL");
		if (!property) return EmptyAction;

		property.setElementTargetValue(on ? "FLAT_LIGHT_ON" : "FLAT_LIGHT_OFF");
		return indiActions.sendNewSwitches(
			this.name,
			property.name,
			property.switches,
		);
	};
}
