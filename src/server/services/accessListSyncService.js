const Observatory = require('../models/observatory/observatory');
const mongoose = require('mongoose');
const logger = require('../logger');
const cron = require('node-cron');

/**
 * Service to synchronize observatory accessList between database and WebSocket managers
 * This ensures that renters can access observatories during their rental period
 */
class AccessListSyncService {
  /**
   * Create a new AccessListSyncService
   * @param {Array} wssManagers - Array of WebSocket managers to update
   */
  constructor(wssManagers) {
    this.wssManagers = wssManagers; // Array of WebSocket managers to update
  }

  /**
   * Synchronize accessLists from database to WebSocket managers
   */
  async syncAccessLists() {
    try {
      // Get all observatories with their accessLists
      const observatories = await Observatory.find({}, 'machine_id accessList owner name');
      logger.debug(`Synchronizing accessLists for ${observatories.length} observatories`);
      
      for (const observatory of observatories) {
        if (!observatory.machine_id) {
          logger.warn(`Observatory ${observatory._id} (${observatory.name}) has no machine_id, skipping`);
          continue;
        }
        
        logger.debug(`Processing observatory ${observatory.name} (${observatory.machine_id})`);
        
        // Ensure accessList is an array (not undefined or null)
        if (!Array.isArray(observatory.accessList)) {
          logger.warn(`Observatory ${observatory._id} (${observatory.name}) has invalid accessList: ${JSON.stringify(observatory.accessList)}`);
          observatory.accessList = [];
          
          // Try to fix the accessList in the database
          try {
            await Observatory.updateOne(
              { _id: observatory._id },
              { $set: { accessList: [] } }
            );
            logger.info(`Fixed invalid accessList for observatory ${observatory.name}`);
          } catch (error) {
            logger.error("Failed to fix invalid accessList for observatory", error, {
              operation: "fixInvalidAccessList",
              observatoryId: observatory._id,
              observatoryName: observatory.name
            });
          }
        }
        
        logger.debug(`AccessList: ${JSON.stringify(observatory.accessList)}`);
        
        // For each WebSocket manager, update the accessList
        for (const manager of this.wssManagers) {
          // Initialize observatory access if not already initialized
          if (!manager.observatoryAccess.has(observatory.machine_id)) {
            // Find the master user (owner)
            const masterEntry = observatory.accessList.find(entry => entry.role === 'master');
            if (masterEntry) {
              logger.debug(`Initializing observatory access for ${observatory.name} with master ${masterEntry.username}`);
              manager.initObservatoryAccess(observatory.machine_id, masterEntry.username);
            } else {
              logger.warn(`No master user found for observatory ${observatory.name}`);
              
              // If no master is found but we have an owner, add the owner as master
              if (observatory.owner) {
                // Get the owner's username
                try {
                  const ownerDoc = await mongoose.model('User').findOne({ username: observatory.owner });
                  if (ownerDoc && ownerDoc.username) {
                    logger.info(`Adding owner ${ownerDoc.username} as master for observatory ${observatory.name}`);
                    manager.initObservatoryAccess(observatory.machine_id, ownerDoc.username);
                    
                    // Also update the database
                    await Observatory.updateOne(
                      { _id: observatory._id },
                      { $push: { accessList: { username: ownerDoc.username, role: 'master' } } }
                    );
                  }
                } catch (error) {
                  logger.error("Failed to add owner as master for observatory", error, {
                    operation: "addOwnerAsMaster",
                    observatoryId: observatory._id,
                    observatoryName: observatory.name,
                    ownerUsername: ownerDoc.username
                  });
                }
              }
            }
          }
          
          // Owner is already included in the accessList when the observatory is created
          
          // Update accessList for each user
          for (const access of observatory.accessList) {
            if (!access.username || !access.role) {
              logger.warn(`Invalid access entry for observatory ${observatory.name}: ${JSON.stringify(access)}`);
              continue;
            }
            manager.addUserAccess(access.username, observatory.machine_id, access.role);
          }
          
          // Remove users who are no longer in the database accessList
          const currentUsers = manager.getObservatoryUsers(observatory.machine_id);
          const dbUsernames = observatory.accessList.map(access => access.username).filter(Boolean);
          
          for (const username of currentUsers) {
            // Don't remove the owner/master
            if (!dbUsernames.includes(username) && username !== observatory.owner) {
              manager.removeUserAccess(username, observatory.machine_id);
            }
          }
        }
      }
      
      logger.info('AccessList synchronization completed successfully');
    } catch (error) {
      logger.error("Error synchronizing accessLists", error, {
        operation: "syncAccessLists"
      });
    }
  }

  /**
   * Start the synchronization service
   */
  start() {
    // Run every minute
    cron.schedule('* * * * *', () => this.syncAccessLists());
    logger.info('AccessList sync service started');
    
    // Run immediately on startup
    this.syncAccessLists();
    
    return Promise.resolve(); // Return a resolved promise for consistency with other services
  }
}

module.exports = AccessListSyncService;
