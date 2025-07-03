export const IMAGES_MIN_SIZE = {
	logo: { width: 100, height: 100 },
	model: { width: 480, height: 300 },
	observatory: { width: 480, height: 300 },
	profile_background: { width: 400, height: 100 },
	avatar: { width: 100, height: 100 },
	observatory_preview: { width: 300, height: 300 },
	post_image: { width: 400, height: 400 },
};

export const IMAGES_ASPECT_RATIO = {
	logo: 1,
	model: 16 / 10,
	observatory: 16 / 10,
	profile_background: 4 / 1,
	avatar: 1,
	observatory_preview: 1,
	post_image: 1,
};

/**
 * Validates the dimensions of an image against the minimum required size for a specific image type.
 *
 * @param {number} width - The width of the image to validate.
 * @param {number} height - The height of the image to validate.
 * @param {string} type - The type of image (e.g., "logo", "model", "avatar").
 * @returns {string} - An empty string if the image is valid, or an error message if the dimensions are too small.
 * @example
 * const errorMessage = validateImage(200, 200, 'logo');
 * if (errorMessage) {
 * console.error(errorMessage);
 * }
 */
export const validateImage = (width, height, type) =>
{
	const dimensions = IMAGES_MIN_SIZE[type];
	if (!dimensions)
	{
		return `Invalid image type: ${type}`;
	}
	const { width: minWidth, height: minHeight } = dimensions;
	if (width < minWidth || height < minHeight)
	{
		return `The selected image's dimensions are too small (Minimum: ${minWidth}x${minHeight})`;
	}
	return "";
};
