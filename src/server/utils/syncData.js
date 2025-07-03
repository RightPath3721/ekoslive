const { get, isEmpty } = require("lodash");

/**
 * Merges multiple arrays of objects and removes duplicates based on `createdAt`.
 * Keeps the latest version based on `updatedAt`.
 * Handles deletions properly, ensuring deleted items are never re-added.
 * If items have the same name or key, keeps only the latest one based on timestamp.
 *
 * @param {Object[]} localArray - Received from the payload.
 * @param {Object[]} remoteArray - Retrieved from MongoDB.
 * @returns {Object[]} - Merged array of objects without duplicates, considering deletions.
 */
function syncData(localArray, remoteArray)
{
	const nameMap = new Map(); // Track latest items by name
	const keyMap = new Map(); // Track latest items by key
	const uuidMap = new Map(); // Track items by UUID with their latest state

	// Helper function to get timestamp from date string
	const getTimestamp = (dateStr) => (dateStr ? new Date(dateStr).getTime() : 0);

	// Helper function to determine which item is more recent
	const isMoreRecent = (newItem, existingItem) =>
	{
		const newTimestamp = getTimestamp(
			newItem.deletedAt || newItem.updatedAt || newItem.createdAt,
		);
		const existingTimestamp = getTimestamp(
			existingItem.deletedAt ||
				existingItem.updatedAt ||
				existingItem.createdAt,
		);
		return newTimestamp > existingTimestamp;
	};

	// Process both arrays
	const combinedArray = [...localArray, ...remoteArray];

	for (const item of combinedArray)
	{
		if (!item.uuid || (!item.name && !item.key))
		{
			continue;
		}

		if (item.deletedAt)
		{
			uuidMap.set(item.uuid, item);
			continue;
		}

		if (uuidMap.has(item.uuid))
		{
			const existingItem = uuidMap.get(item.uuid);

			if (isMoreRecent(item, existingItem))
			{
				uuidMap.set(item.uuid, item);
				nameMap.set(item.name, item);
			}

			continue;
		}

		// Check if there's another item with the same name
		if (item.name && nameMap.has(item.name))
		{
			const existingItem = nameMap.get(item.name);

			// If they have different UUIDs but this one is more recent, update it
			if (existingItem.uuid !== item.uuid)
			{
				if (isMoreRecent(item, existingItem))
				{
					nameMap.set(item.name, item);
					uuidMap.set(item.uuid, item);
					uuidMap.delete(existingItem.uuid);
				}
				else
				{
					continue;
				}
			}
			else if (isMoreRecent(item, existingItem))
			{
				nameMap.set(item.name, item);
				uuidMap.set(item.uuid, item);
			}

			continue;
		}

		if (item.key && keyMap.has(item.key))
		{
			const existingItem = keyMap.get(item.key);

			if (existingItem.uuid !== item.uuid)
			{
				if (isMoreRecent(item, existingItem))
				{
					keyMap.set(item.key, item);
					uuidMap.set(item.uuid, item);
					uuidMap.delete(existingItem.uuid);
				}
				else
				{
					continue;
				}
			}
			// If they have the same UUID but this one is more recent, update it
			else if (isMoreRecent(item, existingItem))
			{
				keyMap.set(item.key, item);
				uuidMap.set(item.uuid, item);
			}

			continue;
		}

		if (item.name)
		{
			nameMap.set(item.name, item);
		}
		if (item.key)
		{
			keyMap.set(item.key, item);
		}
		uuidMap.set(item.uuid, item);
	}

	const result = Array.from(uuidMap.values());

	return result;
}

module.exports = syncData;
