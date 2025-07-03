export const generateURLParams = (data) =>
{
	const params = new URLSearchParams(data);
	return `?${params.toString()}`;
};
