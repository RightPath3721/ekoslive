class WssBaseManager
{
	constructor(server)
	{
		this.userClients = new Set();
		this.ekosClients = new Map();
		this.observatoryAccess = new Map(); // machineID -> ObservatoryAccess
		this.wss = server;
	}

	/**
	 * Initialize observatory access when an Ekos client connects
	 * @param {string} machineID - The machine ID of the observatory
	 * @param {string} username - The username of the connecting user
	 * @returns {boolean} - True if initialization was successful, false otherwise
	 */
	async initObservatoryAccess(machineID, username)
	{
		const logger = require('../logger');
		const Observatory = require('../models/observatory/observatory');
		const User = require('../models/user');
		
		try {
			// Find the observatory by machine_id
			let observatory = await Observatory.findOne({ machine_id: machineID });
			
			if (!observatory) {
				logger.warn(`initObservatoryAccess: No observatory found in database for machineID ${machineID}`);
				
				// Try to find by observatory name if we have an ekosClient with this machineID
				const ekosClient = this.ekosClients.get(machineID);
				if (ekosClient && ekosClient.observatoryName) {
					observatory = await Observatory.findOne({ name: ekosClient.observatoryName });
					
					if (observatory) {
						// Update the machine_id
						await Observatory.updateOne(
							{ _id: observatory._id },
							{ machine_id: machineID }
						);
						logger.info(`Updated machine_id for observatory ${ekosClient.observatoryName} to ${machineID}`);
					}
				}
				
				if (!observatory) {
					// Create in-memory access anyway
					this.observatoryAccess.set(machineID, {
						machineID,
						masterUsername: username,
						currentController: username,
						accessList: new Map([[username, 'master']])
					});
					return true;
				}
			}
			
			// Get the owner's username
			let ownerUsername = username; // Default to connecting user
			
			// If this observatory access doesn't exist yet in memory, create it
			if (!this.observatoryAccess.has(machineID)) {
				// Create in-memory access with owner as master
				this.observatoryAccess.set(machineID, {
					machineID,
					masterUsername: ownerUsername,
					currentController: ownerUsername, // Initially, master is the controller
					accessList: new Map([[ownerUsername, 'master']])
				});
				
				// Make sure owner is in accessList in database
				const ownerInAccessList = observatory.accessList.find(entry => entry.username === ownerUsername);
				
				if (!ownerInAccessList) {
					// Add owner as master
					await Observatory.updateOne(
						{ _id: observatory._id },
						{ 
							$push: { accessList: { username: ownerUsername, role: 'master' } }
						}
					);
					logger.info(`Added owner ${ownerUsername} as master to observatory ${machineID} in database`);
				} else if (ownerInAccessList.role !== 'master') {
					// Update role to master
					await Observatory.updateOne(
						{ 
							_id: observatory._id, 
							'accessList.username': ownerUsername 
						},
						{ 
							$set: { 
								'accessList.$.role': 'master'
							} 
						}
					);
					logger.info(`Updated owner ${ownerUsername} role to master for observatory ${machineID} in database`);
				}
				
				// If connecting user is not the owner, add them as renter
				if (username !== ownerUsername) {
					const userInAccessList = observatory.accessList.find(entry => entry.username === username);
					
					if (!userInAccessList) {
						// Add connecting user as renter
						await Observatory.updateOne(
							{ _id: observatory._id },
							{ 
								$push: { 
									accessList: { 
										username, 
										role: 'renter',
										rentalStart: new Date(),
										rentalEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 1 day rental
									} 
								} 
							}
						);
						
						// Update in-memory access
						const access = this.observatoryAccess.get(machineID);
						access.accessList.set(username, 'renter');
						
						logger.info(`Added connecting user ${username} as renter to observatory ${machineID}`);
					}
				}
			} 
			// If it exists in memory, check if the user is already in the access list
			else {
				const access = this.observatoryAccess.get(machineID);
				
				// If user is not in the access list, add them as a renter by default
				if (!access.accessList.has(username) && username !== access.masterUsername) {
					// Update in-memory access
					access.accessList.set(username, 'renter');
					
					// Check if user is already in accessList in database
					const userInAccessList = observatory.accessList.find(entry => entry.username === username);
					
					if (!userInAccessList) {
						// Add user as renter
						await Observatory.updateOne(
							{ _id: observatory._id },
							{ 
								$push: { 
									accessList: { 
										username, 
										role: 'renter',
										rentalStart: new Date(),
										rentalEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 1 day rental
									} 
								} 
							}
						);
						logger.info(`Added user ${username} as renter to observatory ${machineID} in database`);
					}
				}
			}
			
			return true;
		} catch (error) {
			logger.error("Error in initObservatoryAccess", error, {
				operation: "initObservatoryAccess",
				machineID,
				username
			});
			
			// Create in-memory access anyway to prevent further errors
			if (!this.observatoryAccess.has(machineID)) {
				this.observatoryAccess.set(machineID, {
					machineID,
					masterUsername: username,
					currentController: username,
					accessList: new Map([[username, 'master']])
				});
			}
			
			return true;
		}
	}

	/**
	 * Add a user to an observatory's access list
	 * @param {string} username - The username to add
	 * @param {string} machineID - The machine ID of the observatory
	 * @param {string} role - The role of the user ('master', 'renter', or 'spectator')
	 * @returns {boolean} - True if the user was added successfully, false otherwise
	 */
	async addUserAccess(username, machineID, role)
	{
		const logger = require('../logger');
		const access = this.observatoryAccess.get(machineID);
		
		if (access)
		{
			// Update in-memory access
			access.accessList.set(username, role);
			
			// Update database
			try {
				const Observatory = require('../models/observatory/observatory');
				
				// Find the observatory by machine_id
				const observatory = await Observatory.findOne({ machine_id: machineID });
				
				if (!observatory) {
					logger.warn(`addUserAccess: No observatory found in database for machineID ${machineID}`);
					return true; // Still return true since in-memory was updated
				}
				
				// Check if user is already in accessList
				const existingIndex = observatory.accessList.findIndex(entry => entry.username === username);
				
				if (existingIndex !== -1) {
					// Update existing entry
					await Observatory.updateOne(
						{ 
							machine_id: machineID, 
							'accessList.username': username 
						},
						{ 
							$set: { 'accessList.$.role': role } 
						}
					);
				} else {
					// Add new entry
					await Observatory.updateOne(
						{ machine_id: machineID },
						{ 
							$push: { 
								accessList: { 
									username, 
									role,
									// Add rental dates if role is renter
									...(role === 'renter' ? {
										rentalStart: new Date(),
										rentalEnd: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 1 day rental
									} : {})
								} 
							} 
						}
					);
					logger.info(`Added user ${username} with role ${role} to observatory ${machineID} in database`);
				}
				
				return true;
			} catch (error) {
				logger.error("Failed to update accessList in database", error, {
					operation: "addUserAccess",
					username,
					machineID,
					role
				});
				// Still return true since in-memory was updated
				return true;
			}
		}
		
		logger.warn(`addUserAccess: No access found for machineID ${machineID}`);
		return false;
	}

	/**
	 * Remove a user from an observatory's access list
	 * @param {string} username - The username to remove
	 * @param {string} machineID - The machine ID of the observatory
	 * @returns {boolean} - True if the user was removed successfully, false otherwise
	 */
	async removeUserAccess(username, machineID)
	{
		const logger = require('../logger');
		const access = this.observatoryAccess.get(machineID);
		
		if (access && access.accessList.has(username))
		{
			// If this user is the current controller in memory, reset to master
			if (access.currentController === username)
			{
				access.currentController = access.masterUsername;
				logger.info(`Reset in-memory controller for observatory ${machineID} to master ${access.masterUsername}`);
			}
			
			// Update in-memory access
			access.accessList.delete(username);
			
			// Update database
			try {
				const Observatory = require('../models/observatory/observatory');
				
				// Remove user from accessList
				await Observatory.updateOne(
					{ machine_id: machineID },
					{ $pull: { accessList: { username } } }
				);
				logger.info(`Removed user ${username} from accessList for observatory ${machineID} in database`);
				
				return true;
			} catch (error) {
				logger.error("Failed to remove user from accessList in database", error, {
					operation: "removeUserAccess",
					username,
					machineID
				});
				// Still return true since in-memory was updated
				return true;
			}
		}
		
		logger.warn(`removeUserAccess: User ${username} not found in accessList for machineID ${machineID}`);
		return false;
	}

	/**
	 * Get the role of a user for an observatory
	 * @param {string} username - The username to check
	 * @param {string} machineID - The machine ID of the observatory
	 * @returns {string|null} - The role of the user ('master', 'renter', or 'spectator'), or null if not found
	 */
	getUserRole(username, machineID)
	{
		const access = this.observatoryAccess.get(machineID);
		if (access && access.accessList.has(username))
		{
			return access.accessList.get(username);
		}
		return null;
	}

	/**
	 * Check if a user can control an observatory
	 * @param {string} username - The username to check
	 * @param {string} machineID - The machine ID of the observatory
	 * @returns {boolean} - True if the user can control the observatory, false otherwise
	 */
	async canUserControl(username, machineID)
	{
		const logger = require('../logger');
		
		try {
			// Get the observatory from the database
			const Observatory = require('../models/observatory/observatory');
			const observatory = await Observatory.findOne({ machine_id: machineID });
			
			if (!observatory) {
				logger.debug(`canUserControl: No observatory found in database for machineID ${machineID}`);
				return false;
			}
			
			// Check if user is in accessList
			const accessEntry = observatory.accessList.find(entry => entry.username === username);
			
			if (!accessEntry) {
				logger.debug(`canUserControl: User ${username} not found in accessList for machineID ${machineID}`);
				return false;
			}
			
			// Master can always control
			if (accessEntry.role === 'master') {
				return true;
			}
			
			// Renter can control if they have an active rental period
			if (accessEntry.role === 'renter') {
				const now = new Date();
				const hasActiveRental = accessEntry.rentalStart && 
					accessEntry.rentalEnd && 
					now >= accessEntry.rentalStart && 
					now <= accessEntry.rentalEnd;
				
				logger.debug(`canUserControl: Renter ${username} has ${hasActiveRental ? 'an active' : 'no active'} rental period`);
				return true; // Allow all renters to control for now
			}
			
			// Spectators can never control
			if (accessEntry.role === 'spectator') {
				logger.debug(`canUserControl: User ${username} is spectator for machineID ${machineID}`);
				return false;
			}
			
			// Default case
			logger.debug(`canUserControl: User ${username} has unknown role ${accessEntry.role}`);
			return false;
		} catch (error) {
			logger.error("Error checking user control in database", error, {
				operation: "canUserControl",
				username,
				machineID
			});
			return false;
		}
	}

	/**
	 * Set a user as the current controller of an observatory (in-memory only)
	 * @param {string} username - The username to set as controller
	 * @param {string} machineID - The machine ID of the observatory
	 * @returns {boolean} - True if the user was set as controller, false otherwise
	 */
	async setCurrentController(username, machineID)
	{
		const logger = require('../logger');
		const access = this.observatoryAccess.get(machineID);
		
		if (!access) {
			logger.warn(`setCurrentController: No access found for machineID ${machineID}`);
			return false;
		}
		
		const role = access.accessList.get(username);
		if (role === 'master' || role === 'renter')
		{
			// Update in-memory access only
			access.currentController = username;
			logger.info(`Updated in-memory controller for observatory ${machineID} to ${username}`);
			return true;
		}
		
		logger.warn(`setCurrentController: User ${username} with role ${role} cannot be set as controller`);
		return false;
	}

	/**
	 * Get the current controller of an observatory
	 * @param {string} machineID - The machine ID of the observatory
	 * @returns {string|null} - The username of the current controller, or null if not found
	 */
	async getCurrentController(machineID)
	{
		const logger = require('../logger');
		const Observatory = require('../models/observatory/observatory');
		
		try {
			// Check MongoDB for the observatory
			const observatory = await Observatory.findOne({ machine_id: machineID });
			
			if (!observatory) {
				logger.warn(`getCurrentController: No observatory found for machineID ${machineID}`);
				
				// Fall back to in-memory access if available
				const access = this.observatoryAccess.get(machineID);
				return access ? access.masterUsername : null;
			}
			
			// Check if there's a renter in the accessList
			const renter = observatory.accessList.find(entry => 
				entry.role === 'renter' && 
				entry.rentalStart && entry.rentalEnd && 
				new Date() >= new Date(entry.rentalStart) && 
				new Date() <= new Date(entry.rentalEnd)
			);

			
			if (renter) {
				logger.debug(`getCurrentController: Found active renter ${renter.username} for machineID ${machineID}`);
				return renter.username;
			}
			
			// If no active renter found, find the master/owner in the accessList
			const master = observatory.accessList.find(entry => entry.role === 'master');
			if (master) {
				logger.debug(`getCurrentController: Returning master ${master.username} for machineID ${machineID}`);
				return master.username;
			}
			
			// If no master found in accessList, use the owner field
			if (observatory.owner) {
				logger.debug(`getCurrentController: Returning owner ${observatory.owner} for machineID ${machineID}`);
				return observatory.owner;
			}
			
			// Fall back to in-memory access if available
			const access = this.observatoryAccess.get(machineID);
			if (access) {
				logger.debug(`getCurrentController: Falling back to in-memory master ${access.masterUsername} for machineID ${machineID}`);
				return access.masterUsername;
			}
			
			logger.warn(`getCurrentController: No controller found for machineID ${machineID}`);
			return null;
		} catch (error) {
			logger.error("Error in getCurrentController", error, {
				operation: "getCurrentController",
				machineID
			});
			return null;
		}
	}

	/**
	 * Get all users with access to an observatory
	 * @param {string} machineID - The machine ID of the observatory
	 * @returns {string[]} - An array of usernames with access to the observatory
	 */
	getObservatoryUsers(machineID)
	{
		const access = this.observatoryAccess.get(machineID);
		return access ? Array.from(access.accessList.keys()) : [];
	}

	/**
	 * @param {string} username - User's username.
	 * @returns {null|*} Returns ekos client or null if it was not found.
	 */
	getEkosClientByUser(username)
	{
		for (const [, ekosClient] of this.ekosClients)
		{
			if (ekosClient.username === username) return ekosClient;
		}
		return null;
	}

	/**
	 * @param {string} token - Ekos token.
	 * @returns {null|*} Return EkosClient if it was found, otherwise returns null.
	 */
	getEkosClientByToken(token)
	{
		for (const [, ekosClient] of this.ekosClients)
		{
			if (ekosClient.token === token) return ekosClient;
		}

		return null;
	}

	/**
	 * @param {string} token - Ekos client active token.
	 * @returns {void}
	 */
	removeEkosClientByToken(token)
	{
		const client = this.getEkosClientByToken(token);
		if (client) this.ekosClients.delete(client.machineID);
	}

	/**
	 * Update a kstars instance which will set as active connection for user.
	 * @param {string} username - The username of the user-client.
	 * @param {string} machine_id - The machine id of selected kstars.
	 * @returns {*|null} Returns the updated client if it was found and updated, otherwise returns null.
	 */
	updateUserActiveKstars(username, machine_id)
	{
		let updatedUser = null;
		for (const userClient of this.userClients)
		{
			if (userClient.username === username)
			{
				updatedUser = userClient;
				updatedUser.machineID = machine_id;
				this.userClients.delete(userClient);
				break;
			}
		}
		if (updatedUser) this.userClients.add(updatedUser);
		return updatedUser;
	}

	/**
	 * Delete a kstars active instance if it set as active.
	 * @param {string} machine_id - The machine id of the KStar.
	 * @returns {*|null} Returns the updated client if it was found and updated, otherwise returns null.
	 */
	deleteUserActiveKstars(machine_id)
	{
		const client = this.getUserClient(null, machine_id);
		if (client)
		{
			const updatedClient = { ...client, machine_id: null };
			this.userClients.delete(client);
			this.userClients.add(updatedClient);

			return updatedClient;
		}
		return null;
	}

	/**
	 * Returns an array of active and unique Ekos client IDs for a given username.
	 * Iterates through the `ekosClients` array and filters clients based on the provided username.
	 * @param {string} username - The username to filter Ekos clients by.
	 * @returns {Array<{ machineID: string, observatoryName: string }>} An array of objects containing machine ID and observatory name for active Ekos clients.
	 */
	getActiveEkosClientIDs(username)
	{
		const result = [];
		this.ekosClients.forEach((ekosClient) =>
		{
			if (ekosClient.username === username)
			{
				result.push({
					machineID: ekosClient.machineID,
					observatoryName: ekosClient.observatoryName,
				});
			}
		});
		return [...new Set(result)];
	}

	/**
	 * @param {string} username - Username of the user-client.
	 * @param {string} [machineID] - ID of the connected ekos machine of the user-client.
	 * @returns {null|*} Returns userClient if it's found, otherwise returns null.
	 */
	getUserClient(username, machineID = null)
	{
		let client = null;
		for (const userClient of this.userClients)
		{
			// The priority here is the machine ID, and if no user has requested a machine ID, the search is performed by username
			if (
				(machineID && userClient.machineID === machineID) ||
				(!client && userClient.username === username)
			)
			{
				client = userClient;
				break;
			}
		}
		if (client && client?.username === username) return client;
		return null;
	}

	/**
	 * @param {string} username - Username of the user-client.
	 * @returns {null|*} Returns ekosClient if it's found, otherwise returns null.
	 */
	getEkosClient(username)
	{
		for (const [, ekosClient] of this.ekosClients)
		{
			if (ekosClient.username === username) return ekosClient;
		}

		return null;
	}
}

module.exports = WssBaseManager;
