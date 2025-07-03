// noinspection JSUnusedGlobalSymbols
import { get, isEmpty } from "lodash";

import { IDevice } from "./IDevice";
import { IPPerm, IPState } from "../enums";
import { indiActions } from "../../redux/actions";
import { EmptyAction } from "../../common/common";

export class Camera extends IDevice
{
	constructor(name, props, deviceType)
	{
		super(name, props, deviceType);
		this._canCool = null;
		this._isoList = null;
		this._isDSLR = null;

		this._hasGain = null;
		this._gainElement = null;

		this._hasOffset = null;
		this._offsetElement = null;

		for (const oneProp of props) this.registerProperty(oneProp);
	}

	/**
	 * If property is added, process it.
	 * @param oneProp
	 */
	addProperty(oneProp)
	{
		super.addProperty(oneProp);
		this.registerProperty(oneProp);
	}

	registerProperty(oneProp)
	{
		// Reset to null so we can check again
		if (oneProp.name === "CCD_GAIN" || oneProp.name === "CCD_CONTROLS")
			this._hasGain = null;
		else if (oneProp.name === "CCD_OFFSET" || oneProp.name === "CCD_CONTROLS")
			this._hasOffset = null;
		else if (oneProp.name === "CCD_ISO")
		{
			this._isoList = null;
			this._isDSLR = null;
		}
		else if (oneProp.name === "CCD_TEMPERATURE") this._canCool = null;
	}

	isDSLR = () =>
	{
		// #1 Find property with name CCD_ISO
		// #2 Create an array with the ISO labels
		if (this._isDSLR === null)
		{
			const iso = this.map.get("CCD_ISO");
			if (iso)
			{
				this._isDSLR = true;
				this._isoList = iso.switches.map((item, index) => item.label);
			}
			else this._isDSLR = false;
		}
		return this._isDSLR;
	};

	isoList = () =>
	{
		if (this.isDSLR()) return this._isoList;
		else return [];
	};

	getISO = () =>
	{
		if (this.isDSLR())
		{
			const isoList = this.getProperty("CCD_ISO");
			if (isoList)
			{
				const index = isoList.getOnSwitchIndex();
				if (index >= 0) return this.isoList()[index];
			}
		}

		return null;
	};

	getISOIndex = () =>
	{
		if (this.isDSLR())
		{
			const isoList = this.getProperty("CCD_ISO");
			if (isoList) return isoList.getOnSwitchIndex();
		}

		return -1;
	};

	/**
	 * Get all available filters
	 * @returns An array list of filters
	 */
	availableFilters = () =>
	{
		const filters = this.getProperty("FILTER_NAME");
		let labels = [];
		filters?.texts.forEach((filter) => labels.push(filter));
		return labels;
	};

	/**
	 * Using current slot and available filters, return an Active filter
	 * @returns Active filter
	 */
	activeFilter = () =>
	{
		const labels = this.availableFilters();
		const slot = this.map.get("FILTER_SLOT");
		let activeFilter;
		if (labels && slot)
		{
			const index = slot.numbers[0].value;
			activeFilter = labels[index];
		}

		return activeFilter;
	};

	canCool = () =>
	{
		// #1 Find property with name CCD_TEMPERATURE
		// #2 Make sure property RW (perm: 2)
		if (this._canCool === null)
		{
			const temperature = this.map.get("CCD_TEMPERATURE");
			if (temperature)
			{
				this._canCool = temperature.perm === IPPerm.IP_RW;
			}
			else this._canCool = false;
		}

		return this._canCool;
	};

	getFrameROI = () =>
	{
		const property = this.map.get("CCD_FRAME");
		if (property)
		{
			return get(property, "numbers", []);
		}
	};

	/**
	 * Set Camera ROI
	 * @param {*} x 0
	 * @param {*} y 0
	 * @param {*} width 1280
	 * @param {*} height 1000
	 * @returns
	 */
	setFrameROI = (x, y, width, height) =>
	{
		const property = this.map.get("CCD_FRAME");
		if (!property) return EmptyAction;
		if (property)
		{
			property.setElementTargetValue("X", x);
			property.setElementTargetValue("Y", y);
			property.setElementTargetValue("WIDTH", width);
			property.setElementTargetValue("HEIGHT", height);
			return indiActions.sendNewNumbers(
				this.name,
				property.name,
				property.numbers,
			);
		}
	};

	getResolution = () =>
	{
		const width = this.getElement("CCD_INFO", "CCD_MAX_X");
		const height = this.getElement("CCD_INFO", "CCD_MAX_Y");
		if (width !== null && height !== null) return { width, height };
		else return null;
	};

	getPixelWH = () =>
	{
		const width = this.getElement("CCD_INFO", "CCD_PIXEL_SIZE_X");
		const height = this.getElement("CCD_INFO", "CCD_PIXEL_SIZE_Y");
		if (width !== null && height !== null) return { width, height };
		else return null;
	};

	hasGain = () =>
	{
		// #1 Find property with name CCD_GAIN
		// #2 Set the gain limits
		if (this._hasGain === null)
		{
			let name = "CCD_GAIN";
			let gain = this.getElement("CCD_GAIN", "GAIN");
			if (isEmpty(gain))
			{
				gain = this.getElement("CCD_CONTROLS", "Gain");
				name = "CCD_CONTROLS";
			}
			if (gain)
			{
				this._hasGain = true;
				this._gainElement = gain;
			}
			else this._hasGain = false;
		}
		return this._hasGain;
	};

	getGain = () =>
	{
		if (this._hasGain) return this._gainElement.value;
		return NaN;
	};

	hasOffset = () =>
	{
		// #1 Find property with name CCD_GAIN
		// #2 Set the offset limits
		// The value is cached in _hasOffset so that subsequent calls
		// immediately returns the value since it does not vary throughout
		// course of the device lifetime.
		if (this._hasOffset === null)
		{
			let name = "CCD_OFFSET";
			let offset = this.getElement("CCD_OFFSET", "OFFSET");
			if (isEmpty(offset))
			{
				offset = this.getElement("CCD_CONTROLS", "Offset");
				name = "CCD_CONTROLS";
			}

			if (offset)
			{
				this._hasOffset = true;
				this._offsetElement = offset;
			}
			else this._hasOffset = false;
		}
		return this._hasOffset;
	};

	getOffset = () =>
	{
		if (this._hasOffset) return this._offsetElement.value;
		return NaN;
	};

	hasStreaming = () =>
	{
		return this.map.get("CCD_VIDEO_STREAM") !== undefined;
	};

	isStreaming = () =>
	{
		const property = this.map.get("CCD_VIDEO_STREAM");
		return property && property.state === IPState.IPS_BUSY;
	};

	/** Return function to be dispatched */
	setRecordingEnabled = (enabled, duration = false, frame = false) =>
	{
		const property = this.map.get("RECORD_STREAM");
		if (!property) return EmptyAction;
		if (!enabled)
		{
			property.setElementTargetValue("RECORD_OFF");
			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
		else
		{
			if (duration) property.setElementTargetValue("RECORD_DURATION_ON");
			else if (frame) property.setElementTargetValue("RECORD_FRAME_ON");
			else property.setElementTargetValue("RECORD_ON");

			return indiActions.sendNewSwitches(
				this.name,
				property.name,
				property.switches,
			);
		}
	};

	/** Return function to be dispatched */
	setStreamingExposure = (exposure) =>
	{
		const property = this.map.get("STREAMING_EXPOSURE");
		if (!property) return EmptyAction;

		property.setElementTargetValue("STREAMING_EXPOSURE_VALUE", exposure);
		return indiActions.sendNewNumbers(
			this.name,
			property.name,
			property.numbers,
		);
	};

	getStreamingExposure = () =>
	{
		return this.getElement(
			"STREAMING_EXPOSURE",
			"STREAMING_EXPOSURE_VALUE",
		);
	};

	/** Return function to be dispatched */
	setStreamingExposure = (exposure) =>
	{
		const property = this.map.get("STREAMING_EXPOSURE");
		if (!property) return EmptyAction;

		property.setElementTargetValue("STREAMING_EXPOSURE_VALUE", exposure);
		return indiActions.sendNewNumbers(
			this.name,
			property.name,
			property.numbers,
		);
	};

	/** Return function to be dispatched */
	setRecordingOptions = (duration = 1, frames = 30) =>
	{
		const property = this.map.get("RECORD_OPTIONS");
		if (!property) return EmptyAction;

		property.setElementTargetValue("RECORD_DURATION", duration);
		property.setElementTargetValue("RECORD_FRAME_TOTAL", frames);
		return indiActions.sendNewNumbers(
			this.name,
			property.name,
			property.numbers,
		);
	};

	/** Return function to be dispatched */
	setRecordingLocation = (directory, file) =>
	{
		const property = this.map.get("RECORD_FILE");
		if (!property) return EmptyAction;

		property.setElementTargetValue("RECORD_FILE_DIR", directory);
		property.setElementTargetValue("RECORD_FILE_NAME", file);
		return indiActions.sendNewTexts(this.name, property.name, property.texts);
	};

	/**
	 * Sets stream encoder type
	 * @param encoder MJPEG or RAW.
	 * @returns {{payload: {payload: *, type: *}, type: string, url: null}}
	 */
	setStreamingEncoder = (encoder) =>
	{
		const property = this.map.get("CCD_STREAM_ENCODER");
		if (!property) return EmptyAction;

		property.setElementTargetValue(encoder);
		return indiActions.sendNewSwitches(
			this.name,
			property.name,
			property.switches,
		);
	};

	/** Return function to be dispatched */
	setStreamingLimits = (maxBufferSize = 512, maxPreviewFPS = 1) =>
	{
		const property = this.map.get("LIMITS");
		if (!property) return EmptyAction;

		property.setElementTargetValue("LIMITS_BUFFER_MAX", maxBufferSize);
		property.setElementTargetValue("LIMITS_PREVIEW_FPS", maxPreviewFPS);
		return indiActions.sendNewNumbers(
			this.name,
			property.name,
			property.numbers,
		);
	};

	/** Return function to be dispatched */
	setStreamingEnabled = (enabled) =>
	{
		const property = this.map.get("CCD_VIDEO_STREAM");
		if (!property) return EmptyAction;

		property.setElementTargetValue(enabled ? "STREAM_ON" : "STREAM_OFF");
		return indiActions.sendNewSwitches(
			this.name,
			property.name,
			property.switches,
		);
	};

	isCapturing = () =>
	{
		const property = this.map.get("CCD_VIDEO_STREAM");
		return property && property.state === IPState.IPS_BUSY;
	};

	hasTemperature = () =>
	{
		return this.map.get("CCD_TEMPERATURE") !== undefined;
	};

	getTemperature = () =>
	{
		const property = this.map.get("CCD_TEMPERATURE");
		if (property) return property.numbers[0].value;
		else return NaN;
	};

	getCoolerPower = () =>
	{
		const property = this.map.get("CCD_COOLER_POWER");
		if (property) return property.numbers[0].value;
		else return NaN;
	};

	getExposure = () =>
	{
		const property = this.map.get("CCD_EXPOSURE");
		if (property) return property.numbers[0].value;
		else return NaN;
	};

	hasBinning = () =>
	{
		return this.map.get("CCD_BINNING") !== undefined;
	};

	getBinning = () =>
	{
		const property = this.map.get("CCD_BINNING");
		if (property)
			return { x: property.numbers[0].value, y: property.numbers[1].value };
		else return { x: 1, y: 1 };
	};

	getTransferFormats = () =>
	{
		const property = this.map.get("CCD_TRANSFER_FORMAT");
		if (property) return property.switches.map((oneFormat) => oneFormat.label);
		else return ["FITS", "Native", "XISF"];
	};

	getCaptureFormats = () =>
	{
		const property = this.map.get("CCD_CAPTURE_FORMAT");
		if (property) return property.switches.map((oneFormat) => oneFormat.label);
		else return ["NA"];
	};

	getCaptureFormat = () =>
	{
		const property = this.map.get("CCD_CAPTURE_FORMAT");
		if (property) return property.getOnSwitchLabel();
		else return ["NA"];
	};

	/**
	 * Deprecated
	 * @returns {number|*}
	 */
	getActiveTelescope = () =>
	{
		const telescopeType = this.map.get("TELESCOPE_TYPE");
		if (telescopeType) return telescopeType.getOnSwitchIndex();
		return -1;
	};

	/**
	 * Returns Streaming Frame values
	 * @returns [{x}, {y}] etc
	 */
	getStreamingFrameROI = () =>
	{
		const property = this.map.get("CCD_STREAM_FRAME");
		if (property)
		{
			return get(property, "numbers", []);
		}
	};

	/**
	 * Set Framing Values in CCD Streaming
	 * @param {*} x 0
	 * @param {*} y 0
	 * @param {*} width 1280
	 * @param {*} height 1000
	 * @returns
	 */
	setStreamingFrameROI = (x, y, width, height) =>
	{
		const property = this.map.get("CCD_STREAM_FRAME");
		if (!property) return EmptyAction;
		if (property)
		{
			property.setElementTargetValue("X", x);
			property.setElementTargetValue("Y", y);
			property.setElementTargetValue("WIDTH", width);
			property.setElementTargetValue("HEIGHT", height);
			return indiActions.sendNewNumbers(
				this.name,
				property.name,
				property.numbers,
			);
		}
	};

	/**
	 * Reset Streaming Frame
	 */
	resetStreamingFrame = () =>
	{
		const resolution = this.getResolution();
		if (resolution)
		{
			const maxWidth = get(resolution, "width.value", null);
			const maxHeight = get(resolution, "height.value", null);
			if (maxHeight !== null && maxHeight !== null)
				return this.setStreamingFrameROI(0, 0, maxWidth, maxHeight);
			return EmptyAction;
		}
	};

	/**
	 * Reset Frame
	 */
	resetFrame = () =>
	{
		const property = this.map.get("CCD_FRAME_RESET");
		if (!property) return EmptyAction;

		property.setElementTargetValue("RESET");
		return indiActions.sendNewSwitches(
			this.name,
			property.name,
			property.switches,
		);
	};

	/**
	 * Get INDI Properties i.e Brightness, Gamma etc
	 * @param {*} property Property name i.e CCD_CONTROLS
	 * @param {*} name Property child name i.e Exposure
	 * @returns Control Properties
	 */
	getControls = (property, name) =>
	{
		return this.getElement(property, name);
	};

	/**
	 * Update value of one property
	 * @param {*} property Property Name i.e CCD_CONTROL
	 * @param {*} name Property child Name i.e Expousre
	 * @param {*} value Target value i.e 16
	 * @returns An action that needs to be dispatched
	 */
	setControls = (property, name, value) =>
	{
		const oneProperty = this.map.get(property);
		if (isEmpty(oneProperty)) return EmptyAction;

		oneProperty.setElementTargetValue(name, value);
		return indiActions.sendNewNumbers(
			this.name,
			oneProperty.name,
			oneProperty.numbers,
		);
	};

	/**
	 * Set Gain
	 * @param {*} value 23
	 * @returns Action that needs to be dispatched
	 */
	setGain = (value) =>
	{
		let oneProperty = this.map.get("CCD_GAIN");
		let oneElement = "GAIN";
		if (isEmpty(oneProperty))
		{
			oneProperty = this.map.get("CCD_CONTROLS");
			oneElement = "Gain";
			if (isEmpty(oneProperty)) return EmptyAction;
		}

		oneProperty.setElementTargetValue(oneElement, value);
		return indiActions.sendNewNumbers(
			this.name,
			oneProperty.name,
			oneProperty.numbers,
		);
	};

	/**
	 * Set Offset
	 * @param {*} value 2000
	 * @returns Action that needs to be dispatched
	 */
	setOffset = (value) =>
	{
		let oneProperty = this.map.get("CCD_OFFSET");
		let oneElement = "OFFSET";
		if (isEmpty(oneProperty))
		{
			oneProperty = this.map.get("CCD_CONTROLS");
			oneElement = "Offset";
			if (isEmpty(oneProperty)) return EmptyAction;
		}

		oneProperty.setElementTargetValue(oneElement, value);
		return indiActions.sendNewNumbers(
			this.name,
			oneProperty.name,
			oneProperty.numbers,
		);
	};
}
