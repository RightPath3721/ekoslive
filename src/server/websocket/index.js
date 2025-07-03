const { WebSocket } = require("ws");

/**
 * Heart beat function for keep socket connection open if it is active, even if there are no messages.
 * @returns {void}
 */
function heartbeat()
{
	this.isAlive = true;
}

/** */
function noop()
{}

const wss1 = new WebSocket.Server({ noServer: true });

const wss2 = new WebSocket.Server({
	noServer: true,
	perMessageDeflate: {
		zlibDeflateOptions: {
			// See zlib defaults.
			chunkSize: 1024,
			memLevel: 7,
			level: 3,
		},
		zlibInflateOptions: {
			chunkSize: 10 * 1024,
		},
		// Other options settable:
		clientNoContextTakeover: true, // Defaults to negotiated value.
		serverNoContextTakeover: true, // Defaults to negotiated value.
		clientMaxWindowBits: 10, // Defaults to negotiated value.
		serverMaxWindowBits: 10, // Defaults to negotiated value.
		// Below options specified as default values.
		concurrencyLimit: 10, // Limits zlib concurrency for perf.
		threshold: 1024, // Size (in bytes) below which messages
		// should not be compressed.
	},
});

const wss3 = new WebSocket.Server({
	noServer: true,
	perMessageDeflate: {
		zlibDeflateOptions: {
			// See zlib defaults.
			chunkSize: 1024,
			memLevel: 7,
			level: 3,
		},
		zlibInflateOptions: {
			chunkSize: 10 * 1024,
		},
		// Other options settable:
		clientNoContextTakeover: true, // Defaults to negotiated value.
		serverNoContextTakeover: true, // Defaults to negotiated value.
		clientMaxWindowBits: 10, // Defaults to negotiated value.
		serverMaxWindowBits: 10, // Defaults to negotiated value.
		// Below options specified as default values.
		concurrencyLimit: 10, // Limits zlib concurrency for perf.
		threshold: 1024, // Size (in bytes) below which messages
		// should not be compressed.
	},
});

// Listen to Websocket connections
const wssMessageServerManager = require("./wssMessageServerManager");
const wssMessageManager = new wssMessageServerManager(wss1);
wssMessageManager.listen();
wss1.on("connection", function connection(ws)
{
	ws.isAlive = true;
	ws.on("pong", heartbeat);
});

// #2 Media (images, video..etc)
const wssMediaServerManager = require("./wssMediaServerManager");
const wssMediaManager = new wssMediaServerManager(wss2, wssMessageManager);
wssMediaManager.listen();
wss2.on("connection", function connection(ws)
{
	ws.isAlive = true;
	ws.on("pong", heartbeat);
});

// #3 Cloud (FITS/DSLR + Metadata)
const wssCloudServerManager = require("./wssCloudServerManager");
const wssCloudManager = new wssCloudServerManager(wss3, wssMessageManager);
wssCloudManager.listen();
wss3.on("connection", function connection(ws)
{
	ws.isAlive = true;
	ws.on("pong", heartbeat);
});

wssMediaManager.setCloudManager(wssCloudManager);

// #3 Check every 30 seconds if connection with clients is up
// if not, disconnect them.
setInterval(function ping()
{
	wss1.clients.forEach(function each(ws)
	{
		if (ws.isAlive === false) return ws.terminate();

		ws.isAlive = false;
		ws.ping(noop);
	});

	wss2.clients.forEach(function each(ws)
	{
		if (ws.isAlive === false) return ws.terminate();

		ws.isAlive = false;
		ws.ping(noop);
	});

	wss3.clients.forEach(function each(ws)
	{
		if (ws.isAlive === false) return ws.terminate();

		ws.isAlive = false;
		ws.ping(noop);
	});
}, 30000);

module.exports = {
	wss1,
	wss2,
	wss3,
	wssMessageManager,
	wssMediaManager,
	wssCloudManager,
};
