import api from "@common/shared/utils/api";
import { logError } from "@common/shared/utils/logs";
import { get, isEmpty } from "lodash";

/**
 * Generates a UUID for identifying sync sessions
 * @returns {string} A unique identifier
 */
const generateUUID = () => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
};

/**
 * Used for Sync settings, Currently we support Presets, Achievements, TargetLists, FOV Profiles
 * @param {*} type preset, fov etc.. 
 * @param {*} data Array of objects: [{name: "foo", uuid: "foo", createdAt: timestamp, deletedAt: timestamp},
 *  {name: "foo1", uuid: "foo1", createdAt: timestamp, deletedAt: timestamp},] 
 * @param {*} username current username 
 * @param {*} token user token
 * @param {*} updaterAction An action to dispatch to redux
 * @param {*} URL Ekoslive URL
 */
const SyncSettings = async ({
	type,
	data = [],
	username,
	token,
	updaterAction,
	URL
}) =>
{
	try
	{
		const url =
			URL +
			`/api/sync?username=${username}&token=${token}`;

			const CHUNK_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5MB
			const stringifiedData = JSON.stringify(data);
			const dataSize = new TextEncoder().encode(stringifiedData).length;
			
			// If data is larger than threshold, send it in chunks
			if (dataSize > CHUNK_THRESHOLD_BYTES) {
				const syncSessionId = generateUUID();
				const chunkSize = Math.ceil(data.length / Math.ceil(dataSize / CHUNK_THRESHOLD_BYTES));
				const totalChunks = Math.ceil(data.length / chunkSize);
				let finalMergedData = null;
				
				// Send data in chunks
				for (let i = 0; i < totalChunks; i++) {
					const start = i * chunkSize;
					const end = Math.min((i + 1) * chunkSize, data.length);
					const chunkData = data.slice(start, end);
					const isLastChunk = i === totalChunks - 1;
					
					const response = await api.ekoslivePost(url, {
						type,
						data: chunkData,
						syncSessionId,
						chunkNumber: i,
						totalChunks,
						isLastChunk
					});
					
					// Only store the final response which contains the complete merged data
					if (isLastChunk) {
						finalMergedData = get(response.data, "payload", []);
					}
				}
				
				if (!isEmpty(finalMergedData)) {
					updaterAction(finalMergedData);
				}
			} else {
				// Original logic for smaller payloads
				const res = await api.ekoslivePost(url, {
					type,
					data,
				});
				const array = get(res.data, "payload", []);
				if (!isEmpty(array)) updaterAction(array);
			}
	}
	catch (error)
	{
		logError(`SyncSettings error: ${error}`);
	}
};

export default SyncSettings;