import { toDMS } from "@common/shared/common/common";

export const formatNumber = (format, number) =>
{
	// if format is hh:mm::ss
	if (format[format.length - 1] === "m")
		// remove the + sign for positive numbers, keeping -
		return toDMS(number)[0] === "+" ? toDMS(number).slice(1) : toDMS(number);

	// // if format is degree
	if (format[format.length - 1] === "g")
	{
		return number === 0 ? "0" : number.toFixed(3);
	}

	switch (format)
	{
		case "%5.2f":
			return `${number.toFixed(2)}`.padStart(5);
		case "%.6f":
			return number.toFixed(6);
		case "%.f":
			return number.toFixed(0);
		case "%.1f":
			return number.toFixed(1);
		case "%.2f":
			return number.toFixed(2);
		case "%4.0f":
			return `${number.toFixed(0)}`.padStart(4);
		case "%4.2f":
			return `${number.toFixed(2)}`.padStart(4);
		case "%4.1f":
			return `${number.toFixed(1)}`.padStart(4);
		case "%2.0f":
			return `${number.toFixed(0)}`.padStart(2);
		case "%3.0f":
			return `${number.toFixed(0)}`.padStart(3);
		case "%6.2f":
			return `${number.toFixed(2)}`.padStart(6);
		default:
			return number.toFixed(0);
	}
};
