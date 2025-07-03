/**
 * Truncate a username if it exceeds a certain length, showing the beginning and end portions with ellipsis in between.
 *
 * @param {string} username - The username to be truncated.
 * @param {number} [length=15] - The maximum length allowed before truncating the username.
 * @param {number} [truncateStart=5] - The number of characters to keep from the start of the username.
 * @param {number} [truncateEnd=5] - The number of characters to keep from the end of the username.
 * @returns {string} - The truncated username with ellipsis, or the original username if its length is below the specified limit.
 * @example
 * // returns 'usern...ame'
 * truncateUsername('username123456789', 15, 5, 3);
 * @example
 * // returns 'username'
 * truncateUsername('username', 15);
 */
const truncateUsername = (
	username,
	length = 15,
	truncateStart = 5,
	truncateEnd = 5,
) =>
{
	if (username?.length < length) return username;

	return `${username?.slice(0, truncateStart)}...${username?.slice(-truncateEnd)}`;
};

export default truncateUsername;
