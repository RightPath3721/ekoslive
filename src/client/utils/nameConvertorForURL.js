/**
 * Converts a given name string to a URL-friendly format.
 * @param {string} name - The name string to be converted.
 * @returns {string} The converted URL-friendly string.
 */
export const nameConvertorForURL = (name) =>
{
	if (!name) return "";
	
	return name
		.toLowerCase()
		.replace(/\s+/g, "-") // Replace spaces with dash
		.replace(/[^a-z0-9-]+/g, "-") // Replace any non-alphanumeric chars (except dash) with dash
		.replace(/^-+|-+$/g, "") // Remove leading/trailing dashes
		.replace(/-{2,}/g, "-"); // Replace multiple dashes with single dash
};
