const express = require("express");
const mongoose = require("mongoose");
const { metricsEnabled, register } = require("../middleware/metrics.middleware");
const { wss1, wss2, wss3 } = require("../websocket/index");
const logger = require("../logger");
const UserModel = require("../models/user");

const metricsRoutes = express.Router();

// Try to load PM2 IO if available
let pm2io;
try {
    pm2io = require('@pm2/io');
} catch (error) {
    logger.warn('PM2 IO not available, some metrics will be missing');
}

// Try to load prom-client if available
let promClient;
try {
    promClient = require('prom-client');
    
    // Create WebSocket metrics
    const websocketConnectionsGauge = new promClient.Gauge({
        name: 'websocket_connections',
        help: 'Number of active WebSocket connections',
        labelNames: ['type']
    });

    // Create User metrics
    const activeUsersGauge = new promClient.Gauge({
        name: 'active_users',
        help: 'Number of active users'
    });

    // Register metrics
    register.registerMetric(websocketConnectionsGauge);
    register.registerMetric(activeUsersGauge);

    // Update WebSocket metrics
    const updateWebsocketMetrics = () => {
        websocketConnectionsGauge.set({ type: 'message' }, wss1.clients ? wss1.clients.size : 0);
        websocketConnectionsGauge.set({ type: 'media' }, wss2.clients ? wss2.clients.size : 0);
        websocketConnectionsGauge.set({ type: 'cloud' }, wss3.clients ? wss3.clients.size : 0);
    };

    // Update User metrics
    const updateUserMetrics = async () => {
        try {
            const activeUserCount = await UserModel.countDocuments({ connected: true });
            activeUsersGauge.set(activeUserCount);
        } catch (error) {
            logger.error("Error updating user metrics", error, {
                operation: "updateUserMetrics"
            });
        }
    };

    // Set up interval to update metrics
    setInterval(() => {
        updateWebsocketMetrics();
        updateUserMetrics();
    }, 15000); // Update every 15 seconds

    /* 
    // MongoDB instrumentation is disabled to minimize performance impact
    // Uncomment this section if you want to monitor MongoDB query performance
    
    // Create MongoDB metrics
    const mongoDbOperationDuration = new promClient.Histogram({
        name: 'mongodb_operation_duration_seconds',
        help: 'Duration of MongoDB operations in seconds',
        labelNames: ['operation', 'collection'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
    });
    
    register.registerMetric(mongoDbOperationDuration);
    
    // Instrument mongoose for MongoDB metrics
    const originalExec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = function() {
        const start = Date.now();
        const collection = this.model.collection.name;
        const operation = this.op;
        
        return originalExec.apply(this, arguments)
            .then(result => {
                const duration = (Date.now() - start) / 1000;
                mongoDbOperationDuration.observe({ operation, collection }, duration);
                return result;
            })
            .catch(err => {
                const duration = (Date.now() - start) / 1000;
                mongoDbOperationDuration.observe({ operation, collection }, duration);
                throw err;
            });
    };
    */
} catch (error) {
    logger.warn(`prom-client not available, custom metrics collection disabled: ${error.message}`);
}

// Cache variables for metrics response
let metricsCache = null;
let metricsCacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds cache TTL

/**
 * GET /metrics
 * Returns application metrics in Prometheus format
 * Uses caching to reduce collection overhead
 */
metricsRoutes.get("/", async (req, res) => {
    try {
        if (!metricsEnabled) {
            return res.status(503).send('Metrics collection is disabled. Install prom-client to enable metrics.');
        }

        // Check if we have a valid cache
        const now = Date.now();
        if (metricsCache && (now - metricsCacheTimestamp < CACHE_TTL)) {
            // Use cached metrics
            res.set('Content-Type', register.contentType);
            return res.send(metricsCache);
        }

        // Get metrics from PM2 if available
        if (pm2io) {
            // PM2 metrics would be added here
            // This would require additional implementation to convert PM2 metrics to Prometheus format
        }

        // Get metrics from registry
        const metrics = await register.metrics();
        
        // Update cache
        metricsCache = metrics;
        metricsCacheTimestamp = now;
        
        res.set('Content-Type', register.contentType);
        return res.send(metrics);
    } catch (error) {
        logger.error("Metrics endpoint error", error, {
            operation: "getMetrics"
        });
        return res.status(500).send(`Error collecting metrics: ${error.message}`);
    }
});

module.exports = metricsRoutes;
