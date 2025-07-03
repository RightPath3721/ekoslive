const express = require("express");
const mongoose = require("mongoose");
const { version } = require("../../../package.json");
const { wss1, wss2, wss3 } = require("../websocket/index");
const logger = require("../logger");

const healthRoutes = express.Router();

/**
 * GET /health
 * Returns the health status of the application and its dependencies
 */
healthRoutes.get("/", async (req, res) => {
    try {
        // Check MongoDB connection
        const mongoStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected";
        
        // Check WebSocket servers
        const websocketStatus = {
            message: {
                status: wss1.clients ? "healthy" : "unhealthy",
                connections: wss1.clients ? wss1.clients.size : 0
            },
            media: {
                status: wss2.clients ? "healthy" : "unhealthy",
                connections: wss2.clients ? wss2.clients.size : 0
            },
            cloud: {
                status: wss3.clients ? "healthy" : "unhealthy",
                connections: wss3.clients ? wss3.clients.size : 0
            }
        };

        // Determine overall health status
        const isHealthy = mongoStatus === "connected" && 
                         websocketStatus.message.status === "healthy" &&
                         websocketStatus.media.status === "healthy" &&
                         websocketStatus.cloud.status === "healthy";

        // Get system uptime
        const uptime = process.uptime();

        // Prepare response
        const healthData = {
            status: isHealthy ? "healthy" : "unhealthy",
            timestamp: new Date().toISOString(),
            version,
            uptime,
            dependencies: {
                mongodb: {
                    status: mongoStatus,
                    // Add latency if needed in the future
                },
                websocket: websocketStatus
            }
        };

        // Return appropriate status code based on health
        return res.status(isHealthy ? 200 : 503).json(healthData);
    } catch (error) {
        logger.error("Health check error", error, {
            operation: "healthCheck"
        });
        return res.status(500).json({
            status: "error",
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = healthRoutes;
