import { IDevice } from "./IDevice";

export class Weather extends IDevice
{
	constructor(name, props, deviceType)
	{
		super(name, props, deviceType);
	}

	hasWeatherParameters = () =>
	{
		// #1 Find property with name WEATHER_PARAMETERS
		const temperature = this.getProperty("WEATHER_PARAMETERS");
		if (temperature)
		{
			return true;
		}
		return false;
	};
}
