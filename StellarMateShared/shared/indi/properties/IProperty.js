import Reactor from "../events";

Reactor.registerEvent("propertyUpdate");

export class IProperty
{
	constructor(type, prop)
	{
		this.type = type;
		this.group = prop.group;
		this.label = prop.label;
		this.name = prop.name;
		this.perm = prop.perm;
		this.state = prop.state;
		this.device = prop.device;
		this.throttled = false;
	}

	setThrottled = (value) =>
	{
		this.throttled = value;
	};

	getElement = (element) =>
	{
		switch (this.type) {
			case "INDI_SWITCH":
				return this.switches.find((elem) =>
				{
					return elem.name === element;
				});

			case "INDI_NUMBER":
				return this.numbers.find((elem) =>
				{
					return elem.name === element;
				});

			case "INDI_TEXT":
				return this.texts.find((elem) =>
				{
					return elem.name === element;
				});

			case "INDI_LIGHT":
				return this.lights.find((elem) =>
				{
					return elem.name === element;
				});
		}

		return null;
	};

	getElementByLabel = (element) =>
	{
		switch (this.type) {
			case "INDI_SWITCH":
				return this.switches.find((elem) =>
				{
					return elem.label === element;
				});

			case "INDI_NUMBER":
				return this.numbers.find((elem) =>
				{
					return elem.label === element;
				});

			case "INDI_TEXT":
				return this.texts.find((elem) =>
				{
					return elem.label === element;
				});

			case "INDI_LIGHT":
				return this.lights.find((elem) =>
				{
					return elem.label === element;
				});
		}

		return null;
	};

	syncJSONProperty = (payload) =>
	{
		this.state = payload.state;
		let updated = true;
		const context = this;

		switch (this.type) {
			case "INDI_SWITCH":
				for (const oneJSONSwitch of payload.switches)
				{
					const propertySwitch = context.switches.find(
						(oneSwitch) => oneSwitch.name === oneJSONSwitch.name,
					);
					if (propertySwitch) propertySwitch.state = oneJSONSwitch.state;
				}
				break;
			case "INDI_NUMBER":
				for (const oneJSONNumber of payload.numbers)
				{
					const propertyNumber = context.numbers.find(
						(oneNumber) => oneNumber.name === oneJSONNumber.name,
					);
					if (propertyNumber)
					{
						// Hack to reduce CCD_EXPOSURE_VALUE spam
						if (
							this.throttled &&
							oneJSONNumber.value > 0 &&
							Math.abs(oneJSONNumber.value - propertyNumber.value) < 1
						)
						{
							updated = false;
							break;
						}
						propertyNumber.value = oneJSONNumber.value;
					}
				}
				break;
			case "INDI_TEXT":
				for (const oneJSONText of payload.texts)
				{
					const propertyText = context.texts.find(
						(oneText) => oneText.name === oneJSONText.name,
					);
					if (propertyText) propertyText.text = oneJSONText.text;
				}
				break;
			case "INDI_LIGHT":
				for (const oneJSONLight of payload.lights)
				{
					const propertyLight = context.lights.find(
						(oneLight) => oneLight.name === oneJSONLight.name,
					);
					if (propertyLight) propertyLight.state = oneJSONLight.state;
				}
				break;
		}

		Reactor.dispatchEvent("propertyUpdate", this);
		return updated;
	};
}
