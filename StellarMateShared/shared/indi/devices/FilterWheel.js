import { EmptyAction } from "../../common/common";
import { indiActions } from "../../redux/actions";
import { IDevice } from "./IDevice";
import { isEmpty } from "lodash";

export class FilterWheel extends IDevice
{
	/**
	 * Creates an instance of FilterWheel.
	 *
	 * @constructor
	 * @param {${1:*}} name
	 * @param {${2:*}} props
	 * @param {${3:*}} deviceType
	 */
	constructor(name, props, deviceType)
	{
		super(name, props, deviceType);
	}

	addProperty(oneProp)
	{
		super.addProperty(oneProp);
	}

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
	 * Update the filtername
	 * @param {*} name name of the filter i.e Red
	 * @param {*} filterIndex Index of the filter i.e 2
	 * @returns
	 */
	setFilterName = (name, filterIndex) =>
	{
		const filters = this.map.get("FILTER_NAME");
		if (!isEmpty(filters))
		{
			filters.setElementTargetValue(filters.texts[filterIndex].name, name);
			return indiActions.sendNewTexts(this.name, filters.name, filters.texts);
		}
		else return EmptyAction;
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
			activeFilter = labels[index - 1];
		}

		return activeFilter;
	};
}
