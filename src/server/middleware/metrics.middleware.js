/**
 * Middleware for collecting HTTP metrics
 * Note: This requires the prom-client package to be installed
 * npm install prom-client --save
 */

// This will be initialized when prom-client is available
let httpRequestDuration;
let httpRequestCounter;
let register;

// Flag to check if prom-client is available
let metricsEnabled = false;

try {
    const promClient = require('prom-client');
    register = new promClient.Registry();
    
    // Create HTTP metrics
    httpRequestDuration = new promClient.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    httpRequestCounter = new promClient.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code']
    });

    // Register metrics
    register.registerMetric(httpRequestDuration);
    register.registerMetric(httpRequestCounter);
    
    metricsEnabled = true;
} catch (error) {
    console.warn('prom-client not available, metrics collection disabled');
    metricsEnabled = false;
}

// Cache for metrics response
let metricsCache = null;
let metricsCacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds cache TTL

/**
 * Middleware to track HTTP request metrics
 * Uses 10% sampling rate to minimize performance impact
 */
const metricsMiddleware = (req, res, next) => {
    if (!metricsEnabled) {
        return next();
    }

    // Skip metrics endpoint to avoid circular measurements
    if (req.path === '/metrics') {
        return next();
    }
    
    // Only sample 10% of requests to minimize performance impact
    if (Math.random() > 0.1) {
        return next();
    }

    // Start timer
    const start = Date.now();
    
    // Get route pattern if matched by router
    const route = req.route ? req.route.path : req.path;
    
    // Record end time and update metrics on response finish
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        
        // Increment request counter
        httpRequestCounter.inc({
            method: req.method,
            route: route,
            status_code: res.statusCode
        });
        
        // Record request duration
        httpRequestDuration.observe(
            {
                method: req.method,
                route: route,
                status_code: res.statusCode
            },
            duration
        );
    });
    
    next();
};

module.exports = {
    metricsMiddleware,
    register,
    metricsEnabled
};
