import { find, findIndex, isEmpty, remove } from "lodash";
import Reactor from "../events";
import {
	ILightProperty,
	INumberProperty,
	ISwitchProperty,
	ITextProperty,
} from "../properties";
import { ISState } from "../enums";
import { indiActions } from "../../redux/actions";

// Register propertyDefined event
Reactor.registerEvent("propertyDefined");

export class IDevice
{
	constructor(name, props, type)
	{
		this.name = name;
		this.type = type;
		this.map = new Map();
		this.properties = this.parseProperties(props);
		// Subdevice is when we create a main device and we have to create a subdevice with the same
		// properties but using a different interface or meant for special function
		// for example, CCD Simulator is main device, and CCD Simulator Guider is subDevice
		this.subDevice = false;
		this._driverInterface = null;
		this._connectionProperty = this.getProperty("CONNECTION");
	}

	driverInterface = () =>
	{
		if (this._driverInterface === null)
		{
			const driverInfo = this.getProperty("DRIVER_INFO");
			if (driverInfo)
				this._driverInterface = parseInt(driverInfo.texts[3].text);
		}

		return this._driverInterface;
	};

	syncProps = (props) =>
	{
		this.properties = this.parseProperties(props);
	};

	setSubDevice = (enabled) =>
	{
		this.subDevice = enabled;
	};

	getProperty = (name) =>
	{
		return this.map.get(name);
	};

	isConnected = () =>
	{
		return this._connectionProperty.switches[0].state === ISState.ISS_ON;
	};

	/**
	 * Find if camera properties had time to show up
	 * 10 is arbitrary but should indicate that camera is indeed online
	 * @returns
	 */
	isReady = () =>
	{
		return this.isConnected() && this.properties.length >= 10;
	};

	getElement = (name, element) =>
	{
		const oneProperty = this.getProperty(name);
		if (oneProperty)
		{
			switch (oneProperty.type) {
				case "INDI_SWITCH":
					return find(oneProperty.switches, (elem) =>
					{
						return elem.name === element;
					});

				case "INDI_NUMBER":
					return find(oneProperty.numbers, (elem) =>
					{
						return elem.name === element;
					});

				case "INDI_TEXT":
					return find(oneProperty.texts, (elem) =>
					{
						return elem.name === element;
					});
			}
		}

		return null;
	};

	parseProperties = (props) =>
	{
		let propertiesList = [];
		// Iterate over all
		// append each property to this.properties
		props.forEach((oneProp) =>
		{
			let newProp;
			if (oneProp.hasOwnProperty("numbers"))
			{
				newProp = new INumberProperty(oneProp);
			}
			else if (oneProp.hasOwnProperty("switches"))
			{
				newProp = new ISwitchProperty(oneProp);
			}
			else if (oneProp.hasOwnProperty("texts"))
			{
				newProp = new ITextProperty(oneProp);
			}
			else if (oneProp.hasOwnProperty("lights"))
			{
				newProp = new ILightProperty(oneProp);
			}

			propertiesList.push(newProp);
			this.map.set(newProp.name, newProp);
		});
		return propertiesList;
	};

	addProperty(oneProp)
	{
		let propertiesList = this.properties;

		// check if the property already exists
		// if index == -1, it means it doesn't exist
		let index = findIndex(propertiesList, (item) =>
		{
			return item.name === oneProp.name;
		});

		let newProp;
		// #1 Find out the property type
		// #2 If it already exists, update it's information, else add new property
		if (oneProp.hasOwnProperty("numbers"))
		{
			newProp = new INumberProperty(oneProp);
			index !== -1
				? propertiesList.splice(index, 1, newProp)
				: propertiesList.push(newProp);
		}
		else if (oneProp.hasOwnProperty("switches"))
		{
			newProp = new ISwitchProperty(oneProp);
			index !== -1
				? propertiesList.splice(index, 1, newProp)
				: propertiesList.push(newProp);
		}
		else if (oneProp.hasOwnProperty("texts"))
		{
			newProp = new ITextProperty(oneProp);
			index !== -1
				? propertiesList.splice(index, 1, newProp)
				: propertiesList.push(newProp);
		}
		else if (oneProp.hasOwnProperty("lights"))
		{
			newProp = new ILightProperty(oneProp);
			index !== -1
				? propertiesList.splice(index, 1, newProp)
				: propertiesList.push(newProp);
		}

		this.properties = propertiesList;
		this.map.set(newProp.name, newProp);
		Reactor.dispatchEvent("propertyDefined", newProp);
	}

	removeProperty = (prop) =>
	{
		let propertiesList = this.properties;

		remove(propertiesList, (item) =>
		{
			return item.name === prop.name;
		});

		this.properties = propertiesList;
		this.map.delete(prop.name);
	};

	getMinMaxStep = (property, element) =>
	{
		const oneProperty = this.getProperty(property);
		// This is only applicable to Number properties.
		if (isEmpty(oneProperty) || oneProperty.type !== "INDI_NUMBER") return [];
		return oneProperty.getMinMaxStep(element);
	};

	getRangeList = (property, element) =>
	{
		const oneProperty = this.getProperty(property);
		if (isEmpty(oneProperty)) return [];
		// For switches, we don't need element since we return all the switches
		if (oneProperty.type === "INDI_SWITCH") return oneProperty.getRangeList();
		// For number, we create a list of values from min to max for this specific element incremented by step.
		else if (oneProperty.type === "INDI_NUMBER")
			return oneProperty.getRangeList(element);
		else return [];
	};

	/** Return function to be dispatched to save driver configuration */
	saveConfig = () =>
	{
		const property = this.map.get("CONFIG_PROCESS");
		if (property)
		{
			property.setElementTargetValue("CONFIG_SAVE");
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
		else throw `Configuration property not found in ${this.name}`;
	};

	/**
	 * Return dispatch function to send property values to INDI server. For SWITCH, the switch value is toggled.
	 * @param name Property name
	 * @param element Element name
	 * @param value Required for NUMBER and TEXT property.
	 * @returns {{payload: string, type: string}|{payload: {payload: *, type: *}, type: string, url: null}}
	 */
	sendProperty = (name, element, value) =>
	{
		const property = this.map.get(name);
		if (!property) return { type: "", payload: "" };

		if (property.type === "INDI_SWITCH")
		{
			property.setElementTargetValue(element);
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
		else if (property.type === "INDI_NUMBER")
		{
			property.setElementTargetValue(element, value);
			return indiActions.sendNewNumbers(
				this.name,
				property.name,
				property.numbers,
			);
		}
		else if (property.type === "INDI_TEXT")
		{
			property.setElementTargetValue(element, value);
			return indiActions.sendNewTexts(this.name, property.name, property.texts);
		}
	};

	toArray = (name) =>
	{
		const property = this.getProperty(name);
		if (property) return property.toArray();
		else return [];
	};
}
