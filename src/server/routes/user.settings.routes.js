const express = require("express");
const { isEmpty } = require("lodash");
const logger = require("../logger");
const authMiddleware = require("../middlewares/auth"); // Changed to use authMiddleware
const UserController = require("../controller/user");

const router = express.Router();

/**
 * Convenient function to return error to sender in case of request failure.
 * @param {*} res - Response object to be used to send the response.
 * @param {string} message - Error message.
 * @param {number} code - HTTP error code. Defaults to 400 for bad return.
 * @returns {void} Response object after setting the code and error response.
 */
function throwFailed(res, message, code = 400)
{
    return res.status(code).json({ success: false, message: message });
}

// Middleware to get WSS managers (media and cloud)
// This is a simplified approach; a more robust solution might involve a service locator or dependency injection
function getWssManagers(req, res, next)
{
    // Attempt to get managers from app locals if they are stored there
    // This assumes wssManager is initialized and attached to app.locals.wssManager
    const wssManagerInstance = req.app.locals.wssManager;
    if (wssManagerInstance && wssManagerInstance.getWssMediaServerManager && wssManagerInstance.getWssCloudServerManager)
    {
        req.wssMediaServerManager = wssManagerInstance.getWssMediaServerManager();
        req.wssCloudServerManager = wssManagerInstance.getWssCloudServerManager();
    } else
    {
        logger.warn("WSS Managers not found or not fully initialized on app.locals.wssManager. Live updates to WebSocket clients for settings changes might not occur.");
        // Proceed without them, but live updates to WS clients won't happen from here
    }
    next();
}

// GET /api/user/settings
router.get(
    "/", // Assuming base path is /api/user/settings
    authMiddleware, // Changed to use authMiddleware
    async (req, res) =>
    {
        const { username } = req.query; // Get username from query parameters
        if (!username)
        {
            return throwFailed(res, "Username not provided in query.", 400);
        }
        try
        {
            const user = await UserController.getUser(username);
            if (!user)
            {
                return throwFailed(res, "User not found.", 404);
            }
            res.json({
                success: true,
                settings: {
                    ekosLiveCloudEnabled: user.ekosLiveCloudEnabled,
                    // Add other user-specific settings here if needed in the future
                },
            });
        } catch (error)
        {
            logger.error("Error fetching user settings", error, {
                username,
                operation: "getUserSettings"
            });
            return throwFailed(res, "Server error fetching settings.", 500);
        }
    },
);

// PUT /api/user/settings/cloud-storage
router.put(
    "/cloud-storage",
    authMiddleware, // Changed to use authMiddleware
    getWssManagers, // Middleware to get WebSocket managers
    async (req, res) =>
    {
        const { username } = req.query; // Get username from query parameters
        if (!username)
        {
            return throwFailed(res, "Username not provided in query.", 400);
        }
        const { ekosLiveCloudEnabled } = req.body;

        if (typeof ekosLiveCloudEnabled !== "boolean")
        {
            return throwFailed(res, "Invalid value for ekosLiveCloudEnabled. Must be a boolean.");
        }

        try
        {
            // Corrected to use updateUserProperty
            const updatedUser = await UserController.updateUserProperty(username, {
                ekosLiveCloudEnabled,
            });

            if (!updatedUser)
            {
                return throwFailed(res, "User not found or update failed.", 404);
            }

            logger.info(
                `User ${username} updated ekosLiveCloudEnabled to ${ekosLiveCloudEnabled}`,
            );

            // Attempt to update active WebSocket sessions
            // This requires wssMediaServerManager and wssCloudServerManager to expose a method
            // to update a specific user's ekosClient.cloudEnabled status by username or primaryID.
            // For simplicity, we'll assume such methods exist or can be added.
            // These methods would iterate over their respective ekosClients maps.

            if (req.wssMediaServerManager)
            {
                req.wssMediaServerManager.updateEkosClientCloudSetting(username, ekosLiveCloudEnabled, updatedUser.plan_id);
            }
            if (req.wssCloudServerManager)
            {
                req.wssCloudServerManager.updateEkosClientCloudSetting(username, ekosLiveCloudEnabled, updatedUser.plan_id);
            }

            res.json({
                success: true,
                message: "Cloud storage setting updated successfully.",
                ekosLiveCloudEnabled: updatedUser.ekosLiveCloudEnabled,
            });
        } catch (error)
        {
            logger.error("Error updating cloud storage setting", error, {
                username,
                operation: "updateCloudStorageSetting",
                ekosLiveCloudEnabled
            });
            return throwFailed(res, "Server error updating setting.", 500);
        }
    },
);

module.exports = router;
