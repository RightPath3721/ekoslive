const express = require('express');
const router = express.Router();
const Observatory = require('../models/observatory/observatory');
const Booking = require('../models/observatory/booking');
const { wssMessageManager, wssMediaManager, wssCloudManager } = require('../websocket/index');
const logger = require('../logger');

/**
 * Debug endpoint to check accessList status
 * GET /api/debug/accessList
 */
router.get('/accessList', async (req, res) => {
  try {
    // Get observatory ID from query parameter
    const { observatory_id, machine_id } = req.query;
    
    if (!observatory_id && !machine_id) {
      return res.status(400).json({ error: 'observatory_id or machine_id parameter is required' });
    }
    
    // Get observatory from database
    const query = {};
    if (observatory_id) query._id = observatory_id;
    if (machine_id) query.machine_id = machine_id;
    
    const observatory = await Observatory.findOne(query);
    if (!observatory) {
      return res.status(404).json({ error: 'Observatory not found' });
    }
    
    // Get bookings for this observatory
    const bookings = await Booking.find({ 
      observatory: observatory._id,
      status: 'approved'
    }).populate('renter', 'username');
    
    // Get accessList from WebSocket managers
    const machineID = observatory.machine_id;
    const messageManagerAccess = wssMessageManager.observatoryAccess.get(machineID);
    const mediaManagerAccess = wssMediaManager.observatoryAccess.get(machineID);
    const cloudManagerAccess = wssCloudManager.observatoryAccess.get(machineID);
    
    // Format the response
    const response = {
      observatory: {
        _id: observatory._id,
        name: observatory.name,
        machine_id: observatory.machine_id,
        accessList: observatory.accessList
      },
      bookings: bookings.map(booking => ({
        _id: booking._id,
        renter: booking.renter ? booking.renter.username : null,
        status: booking.status,
        dates: booking.dates.map(date => ({
          date: date.date,
          status: date.status,
          startTime: date.negotiatedStartTime || date.bookedStartTime,
          endTime: date.negotiatedEndTime || date.bookedEndTime
        }))
      })),
      websocketManagers: {
        messageManager: messageManagerAccess ? {
          masterUsername: messageManagerAccess.masterUsername,
          currentController: messageManagerAccess.currentController,
          accessList: Array.from(messageManagerAccess.accessList.entries()).map(([username, role]) => ({ username, role }))
        } : null,
        mediaManager: mediaManagerAccess ? {
          masterUsername: mediaManagerAccess.masterUsername,
          currentController: mediaManagerAccess.currentController,
          accessList: Array.from(mediaManagerAccess.accessList.entries()).map(([username, role]) => ({ username, role }))
        } : null,
        cloudManager: cloudManagerAccess ? {
          masterUsername: cloudManagerAccess.masterUsername,
          currentController: cloudManagerAccess.currentController,
          accessList: Array.from(cloudManagerAccess.accessList.entries()).map(([username, role]) => ({ username, role }))
        } : null
      }
    };
    
    // Log the response for debugging
    logger.debug(`Debug accessList response: ${JSON.stringify(response)}`);
    
    return res.json(response);
  } catch (error) {
    logger.error("Error in debug accessList endpoint", error, {
      operation: "debugAccessList",
      observatory_id: req.query.observatory_id,
      machine_id: req.query.machine_id
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
