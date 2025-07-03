const cron = require('node-cron');
const Observatory = require('../models/observatory/observatory');
const Booking = require('../models/observatory/booking');
const User = require('../models/user');
const logger = require('../logger');
const { wssMessageManager } = require('../websocket');
const NotificationModel = require('../models/notification');

/**
 * Combines date and time strings to create a valid Date object
 * @param {Date} dateObj - The date object
 * @param {string} timeStr - Time string in format "HH:MM"
 * @returns {Date} - Combined date and time as Date object
 */
function combineDateAndTime(dateObj, timeStr) {
  if (!dateObj || !timeStr) return null;
  
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const result = new Date(dateObj);
    result.setHours(hours, minutes, 0, 0);
    return result;
  } catch (error) {
    logger.error("Error parsing time string", error, {
      operation: "combineDateAndTime",
      timeStr
    });
    return null;
  }
}

/**
 * Force logout a user from an active session
 * @param {string} username - The username to logout
 * @param {string} machineID - The machine ID of the observatory
 */
async function forceLogoutUser(username, machineID) {
  try {
    // Get the WebSocket manager from the global app object
    const wssManager = global.app?.wssManager;
    
    if (!wssManager) {
      logger.error("Cannot force logout user - WebSocket manager not available", new Error("WebSocket manager not available"), {
        operation: "forceLogoutUser",
        username,
        machineID
      });
      return;
    }
    
    // Get the user client
    const userClient = wssManager.getUserClient(username, machineID);
    
    if (userClient && userClient.connected && userClient.ws.readyState === 1) { // WebSocket.OPEN = 1
      logger.info(`Forcing logout for user ${username} from observatory with machine ID ${machineID}`);
      
      // Send logout command
      userClient.ws.send(JSON.stringify({ type: "logout" }));
      
      // Clean up client connection
      wssManager.userClients.delete(userClient);
      
      logger.info(`Successfully forced logout for user ${username}`);
    } else {
      logger.debug(`User ${username} not connected or already logged out`);
    }
  } catch (error) {
    logger.error("Error forcing logout for user", error, {
      operation: "forceLogoutUser",
      username,
      machineID
    });
  }
}

/**
 * Send expiry warning notification to a user
 * @param {string} username - The username to notify
 * @param {string} machineID - The machine ID of the observatory
 * @param {number} minutesRemaining - Minutes remaining before expiry
 */
async function sendExpiryWarning(username, machineID, minutesRemaining) {
  try {
    // Get the WebSocket manager from the global app object
    // const wssManager = global.app?.wssManager;
    
    // if (!wssManager) {
    //   logger.error(`Cannot send expiry warning to user ${username}: WebSocket manager not available`);
    //   return;
    // }
    
    // // Get the user client
    // const userClient = wssManager.getUserClient(username, machineID);
    // console.log("User client", userClient);
    
    const notification = await NotificationModel.create({
      type: "POST",
      content: `Your session will expire in ${minutesRemaining} minutes`,
      target_users: [],
      read_users: [],
      channel: "COMMUNITY",
      role: "REGISTERED",
      actions: [{ type: "Booking" }]
    });

    console.log("Notification", notification);
    
    wssMessageManager.sendMessageByUsernames([username], {
      type: "new_unread_notification",
      payload: notification
    });
    
    logger.info(`Successfully sent expiry warning to user ${username}`);
    
    // if (userClient && userClient.connected && userClient.ws.readyState === 1) { // WebSocket.OPEN = 1
    //   logger.info(`Sending ${minutesRemaining} minute expiry warning to user ${username}`);
      
    //   // Determine severity level based on time remaining
    //   // 3 = error (critical), 2 = warning (important), 1 = info (normal)
    //   const severity = minutesRemaining <= 5 ? 3 : (minutesRemaining <= 15 ? 2 : 1);
      
    //   // Create notification similar to how it's done in post.js controller
    //   const notification = {
    //     type: "POST",
    //     severity: severity,
    //     message: `Your session will expire in ${minutesRemaining} minutes`,
    //     uuid: `expiry_warning_${minutesRemaining}`,
    //     channel: "COMMUNITY",
    //     role: "REGISTERED",
    //     actions: [{ type: "Booking" }]
    //   };
      
    //   userClient.ws.send(
    //     JSON.stringify({
    //       type: "new_notification",
    //       payload: notification
    //     })
    //   );
      
    //   logger.info(`Successfully sent expiry warning to user ${username}`);
    // } else {
    //   logger.debug(`User ${username} not connected, cannot send expiry warning`);
    // }
  } catch (error) {
    logger.error("Error sending expiry warning to user", error, {
      operation: "sendExpiryWarning",
      username,
      machineID,
      minutesRemaining
    });
  }
}

/**
 * Updates observatory accessList based on active bookings
 * - Adds renters to accessList when their rental period begins
 * - Removes renters from accessList when their rental period ends
 * - Forces logout of renters when their rental period ends
 * - Sends notifications at 30, 15, and 5 minutes before rental expiry
 */
async function updateAccessLists() {
  try {
    // Get all approved bookings
    const bookings = await Booking.find({ status: 'approved' });
    logger.debug(`Processing ${bookings.length} approved bookings for accessList updates`);
    
    // Also get all observatories with renters in accessList to handle expired rentals
    const observatoriesWithRenters = await Observatory.find({ 'accessList.role': 'renter' });
    logger.debug(`Processing ${observatoriesWithRenters.length} observatories with renters`);
    
    // Process active bookings to add renters
    for (const booking of bookings) {
      const observatory = await Observatory.findById(booking.observatory);
      if (!observatory) {
        logger.warn(`Observatory not found for booking ${booking._id}`);
        continue;
      }
      
      const now = new Date();
      
      // Only process bookings with status 'approved'
      if (booking.status !== 'approved') {
        logger.debug(`Skipping booking ${booking._id} with status ${booking.status}`);
        continue;
      }
      
      // Check each date in the booking
      for (const dateEntry of booking.dates) {
        // Skip date entries that are not approved
        if (dateEntry.status !== 'approved') {
          logger.debug(`Skipping date entry with status ${dateEntry.status} for booking ${booking._id}`);
          continue;
        }
        
        // Properly combine date and time
        const bookingDate = new Date(dateEntry.date);
        const startTimeStr = dateEntry.negotiatedStartTime || dateEntry.bookedStartTime;
        const endTimeStr = dateEntry.negotiatedEndTime || dateEntry.bookedEndTime;
        
        // const startTime = combineDateAndTime(bookingDate, startTimeStr);
        // const endTime = combineDateAndTime(bookingDate, endTimeStr);
        const startTime = new Date(startTimeStr);
        const endTime = new Date(endTimeStr);
        
        if (!startTime || !endTime) {
          logger.warn(`Invalid date/time for booking ${booking._id}: date=${bookingDate}, startTime=${startTimeStr}, endTime=${endTimeStr}`);
          continue;
        }
        
        const renter = await User.findById(booking.renter);
        if (!renter) {
          logger.warn(`Renter not found for booking ${booking._id}`);
          continue;
        }
        
        // Check if rental is active (current time is between start and end)
        const isRentalActive = now >= startTime && now <= endTime;
        
        // Check if renter is in accessList
        const renterIndex = observatory.accessList.findIndex(
          access => access.username === renter.username && access.role === 'renter'
        );
        
        logger.debug(`Booking ${booking._id}: isRentalActive=${isRentalActive}, renter=${renter.username}, inAccessList=${renterIndex !== -1}`);
        
        if (isRentalActive && renterIndex === -1) {
          try {
            // Add renter to accessList if rental is active but they're not in the list
            logger.debug(`Adding renter ${renter.username} to accessList for observatory ${observatory.name}`);
            
            // Create the new accessList entry
            const newAccessEntry = {
              username: renter.username,
              role: 'renter',
              rentalStart: startTime,
              rentalEnd: endTime
            };
            
            // Use MongoDB's direct update operation instead of the model's save method
            const updateResult = await Observatory.updateOne(
              { _id: observatory._id },
              { $push: { accessList: newAccessEntry } }
            );
            
            if (updateResult.modifiedCount === 1) {
              logger.info(`Successfully added ${renter.username} to accessList for observatory ${observatory.name}`);
            } else {
              logger.warn(`Failed to add ${renter.username} to accessList for observatory ${observatory.name}. MongoDB update result: ${JSON.stringify(updateResult)}`);
            }
          } catch (error) {
            logger.error("Error adding renter to accessList", error, {
              operation: "addRenterToAccessList",
              bookingId: booking._id,
              observatoryId: observatory._id,
              observatoryName: observatory.name,
              renterUsername: renter.username
            });
          }
        } else if (!isRentalActive && renterIndex !== -1) {
          try {
            // Remove renter from accessList if rental is not active but they're in the list
            logger.debug(`Removing renter ${renter.username} from accessList for observatory ${observatory.name}`);
            
            // Use MongoDB's direct update operation instead of the model's save method
            const updateResult = await Observatory.updateOne(
              { _id: observatory._id },
              { $pull: { accessList: { username: renter.username, role: 'renter' } } }
            );
            
            if (updateResult.modifiedCount === 1) {
              logger.info(`Successfully removed ${renter.username} from accessList for observatory ${observatory.name}`);
              
              // Force logout the renter if their rental period has ended
              if (observatory.machine_id) {
                await forceLogoutUser(renter.username, observatory.machine_id);
              }
            } else {
              logger.warn(`Failed to remove ${renter.username} from accessList for observatory ${observatory.name}. MongoDB update result: ${JSON.stringify(updateResult)}`);
            }
          } catch (error) {
            logger.error("Error removing renter from accessList", error, {
              operation: "removeRenterFromAccessList",
              bookingId: booking._id,
              observatoryId: observatory._id,
              observatoryName: observatory.name,
              renterUsername: renter.username
            });
          }
        }
      }
    }
    
    // Process all observatories with renters to check for expired rentals
    for (const observatory of observatoriesWithRenters) {
      const now = new Date();
      
      // Check each renter in the accessList
      for (const access of observatory.accessList) {
        if (access.role === 'renter' && access.rentalEnd) {
          const rentalEnd = new Date(access.rentalEnd);
          
          // Calculate time remaining in minutes
          const timeRemainingMs = rentalEnd.getTime() - now.getTime();
          const timeRemainingMinutes = Math.floor(timeRemainingMs / (1000 * 60));

          
          // Check for notification thresholds (30, 15, and 5 minutes)
          // if (observatory.machine_id) {
          //   // 30-minute warning
          //   if (timeRemainingMinutes === 30) {
          //     await sendExpiryWarning(access.username, observatory.machine_id, 30);
          //   }
          //   // 15-minute warning
          //   else if (timeRemainingMinutes === 8) {
          //     await sendExpiryWarning(access.username, observatory.machine_id, 15);
          //   }
          //   // 5-minute warning
          //   else if (timeRemainingMinutes === 4) {
          //     await sendExpiryWarning(access.username, observatory.machine_id, 5);
          //   }
          // }
          
          // If rental period has ended, remove renter from accessList
          if (now > rentalEnd) {
            try {
              logger.debug(`Rental period expired for ${access.username} on observatory ${observatory.name}`);
              
              // Remove renter from accessList
              const updateResult = await Observatory.updateOne(
                { _id: observatory._id },
                { $pull: { accessList: { username: access.username, role: 'renter' } } }
              );
              
              if (updateResult.modifiedCount === 1) {
                logger.info(`Successfully removed expired renter ${access.username} from accessList for observatory ${observatory.name}`);
                
                // Force logout the renter
                if (observatory.machine_id) {
                  await forceLogoutUser(access.username, observatory.machine_id);
                }
              } else {
                logger.warn(`Failed to remove expired renter ${access.username} from accessList for observatory ${observatory.name}`);
              }
            } catch (error) {
              logger.error("Error removing expired renter from accessList", error, {
                operation: "removeExpiredRenterFromAccessList",
                observatoryId: observatory._id,
                observatoryName: observatory.name,
                renterUsername: access.username
              });
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error("Error updating accessLists", error, {
      operation: "updateAccessLists"
    });
  }
}

/**
 * Starts the cron job to update accessLists every minute
 */
function startAccessListUpdater() {
  // Run immediately on startup
  updateAccessLists().then(() => {
    logger.info('Initial accessList update completed');
  }).catch(err => {
    logger.error("Error during initial accessList update", err, {
      operation: "initialAccessListUpdate"
    });
  });
  
  // Then run every minute
  cron.schedule('* * * * *', updateAccessLists);
  logger.info('AccessList updater service started');
}

module.exports = {
  forceLogoutUser,
  startAccessListUpdater,
  updateAccessLists // Exported for testing purposes
};
