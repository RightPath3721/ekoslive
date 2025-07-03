import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * @param {...any} inputs - Parameters for Tailwind to apply them. Each parameter can be either a string (class) or an HTMLElement.
 * @returns {string} - A single string of combined and merged class names.
 */
export function cn(...inputs)
{
	return twMerge(clsx(inputs));
}
