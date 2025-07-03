import { indiActions } from "@redux/actions";
import { IDevice } from "./IDevice";

export class Mount extends IDevice
{
	constructor(name, props, deviceType)
	{
		super(name, props, deviceType);

		this._telescope_info = null;
		this._hasSlewRates = null;
		this._slewRates = null;
		this._supportParkingPos = null;
	}

	hasSlewRates = () =>
	{
		if (this._hasSlewRates) return this._hasSlewRates;

		this._hasSlewRates = this.map.has("TELESCOPE_SLEW_RATE");
		if (this._hasSlewRates)
			this._slewRates = this.map.get("TELESCOPE_SLEW_RATE");

		return this._hasSlewRates;
	};

	slewRate = () =>
	{
		const property = this.map.get("TELESCOPE_SLEW_RATE");
		if (property) return property.getOnSwitchIndex();
		else return 0;
	};

	slewRates = () =>
	{
		if (this.hasSlewRates() === false) return [];

		return this._slewRates;
	};

	/**
	 * Set Mount Slew Rate
	 * @param value index 0 to Max-1
	 * @returns {{payload: string, type: string}|Action}
	 */
	setSlewRate = (value) =>
	{
		const property = this.map.get("TELESCOPE_SLEW_RATE");
		if (property)
		{
			const name = property.switches[value].name;
			property.setElementTargetValue(name);
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
		else
		{
			return { type: "", payload: "" };
		}
	};

	getTelescopeInfo = () =>
	{
		if (this._telescope_info) return this._telescope_info;

		const telescopeInfo = this.getProperty("TELESCOPE_INFO");
		if (telescopeInfo)
		{
			const primaryAperture = telescopeInfo.getElement("TELESCOPE_APERTURE");
			const primaryFocalLength = telescopeInfo.getElement(
				"TELESCOPE_FOCAL_LENGTH",
			);
			const guideAperture = telescopeInfo.getElement("GUIDER_APERTURE");
			const guideFocalLength = telescopeInfo.getElement("GUIDER_FOCAL_LENGTH");

			this._telescope_info = [
				{
					id: 0,
					aperture: primaryAperture.value,
					focal_length: primaryFocalLength.value,
				},
				{
					id: 1,
					aperture: guideAperture.value,
					focal_length: guideFocalLength.value,
				},
			];

			return this._telescope_info;
		}
	};

	// Return the Reverse States on render
	reverseDirectionSwitches = () =>
	{
		const property = this.map.get("TELESCOPE_REVERSE_MOTION");
		if (property) return property.switches;
		else return null;
	};

	// Return redux action that needs to be dispatch to toggle Reverse Switches

	toggleNorthSouthDirections = () =>
	{
		const property = this.map.get("TELESCOPE_REVERSE_MOTION");
		if (!property) return { type: "", payload: "" };
		property.setElementTargetValue("REVERSE_NS");
		return indiActions.sendNewSwitches(
			this.name,
			property.name,
			property.switches,
		);
	};

	toggleWestEastDirections = () =>
	{
		const property = this.map.get("TELESCOPE_REVERSE_MOTION");
		if (!property) return { type: "", payload: "" };
		property.setElementTargetValue("REVERSE_WE");
		return indiActions.sendNewSwitches(
			this.name,
			property.name,
			property.switches,
		);
	};

	hasParkingPosition = () =>
	{
		return this.getProperty("TELESCOPE_PARK_POSITION") !== undefined;
	};

	setParkOption = (option) =>
	{
		const property = this.map.get("TELESCOPE_PARK_OPTION");
		if (property)
		{
			property.setElementTargetValue(option);
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
	};

	hasHomeSupport = () =>
	{
		const property = this.getProperty("TELESCOPE_HOME");
		return property !== undefined;
	};

	setHomeOption = (option) =>
	{
		const property = this.getProperty("TELESCOPE_HOME");
		if (property)
		{
			property.setElementTargetValue(option);
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
	};

	getHomeSwitches = () =>
	{
		const property = this.getProperty("TELESCOPE_HOME");
		if (property)
		{
			return property.switches;
		}
	};

	/**
	 * Checks whether Calibration Model is supported
	 * @returns Boolean
	 */
	canClearAlignmentModel = () =>
	{
		const property = this.map.get("ALIGNMENT_POINTSET_ACTION");
		if (property) return true;
		else return false;
	};

	/**
	 * Clear Calibration model
	 * @returns Updated Swtich
	 */
	clearAlignmentModel = () =>
	{
		const property = this.map.get("ALIGNMENT_POINTSET_ACTION");
		if (property)
		{
			property.setElementTargetValue("DELETE");
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
	};
}
