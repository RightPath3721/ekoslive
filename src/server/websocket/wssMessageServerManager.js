const url = require("url");

const ekosController = require("../controller/ekos");
const userController = require("../controller/user");
const { secret } = require("../config");
const logger = require("../logger");
const { compareVersions } = require("compare-versions");

const WebSocket = require("ws");
const wstokenVerifier = require("../auth/ws-token-verifier");
const commands = require("../../../StellarMateShared/shared/commands");
const wssBaseManager = require("./wssBaseManager");
const NotificationModel = require("../models/notification");
const UserModel = require("../models/user");
const ObservatoryModel = require("../models/observatory/observatory");

// Add new command types for observatory access control
commands.SET_OBSERVATORY_ACCESS = "set_observatory_access";
commands.GET_OBSERVATORY_ACCESS = "get_observatory_access";
commands.SET_OBSERVATORY_CONTROLLER = "set_observatory_controller";
commands.GET_OBSERVATORY_CONTROLLER = "get_observatory_controller";
commands.OBSERVATORY_ACCESS_CHANGED = "observatory_access_changed";
commands.OBSERVATORY_CONTROLLER_CHANGED = "observatory_controller_changed";

class wssMessageServerManager extends wssBaseManager
{
	constructor(server)
	{
		super(server);
		this.wss = server;

		// Make the WebSocket manager available globally for other services
		if (global.app)
		{
			global.app.wssManager = this;
		}
		else
		{
			global.app = { wssManager: this };
		}
	}

	sendUserNotification(username, message)
	{
		const userClient = this.getUserClient(username);
		if (
			userClient &&
			userClient.connected &&
			userClient.ws.readyState === WebSocket.OPEN
		)
			userClient.ws.send(
				JSON.stringify({
					token: userClient.token,
					type: commands.NEW_NOTIFICATION,
					payload: message,
				}),
			);
	}

	async #getUser(username)
	{
		const user = await UserModel.findOne({ username }).populate(
			"socialAccount",
		);
		if (!user) throw new Error("User not found");
		return user;
	}

	listen()
	{
		// Global WebSocket server error handler
		this.wss.on("error", (error) =>
		{
			logger.error("WebSocket Server Error (wssMessageServerManager)", error, {
				operation: "websocketServerError",
				component: "wssMessageServerManager"
			});
		});

		this.wss.on("connection", async (ws, req) =>
		{
			// Declare variables needed in outer scope (for close handler)
			let location, username, primaryID, token;

			try
			{
				// Wrap initial connection setup logic
				location = url.parse(req.url, true); // Assign to outer scope variable

				const version = location.query.version;
				username = decodeURIComponent(location.query.username); // Assign to outer scope variable
				token = location.query.token; // Assign to outer scope variable
				const machineID = location.query.machine_id ?? username;
				// Set the primary ID as the username if machine_id is missing to ensure proper handling older versions of KStars.
				primaryID =
					machineID && machineID !== "undefined" ? machineID : username; // Assign to outer scope variable
				const observatoryName = location.query.observatory ?? null;

				// Ekos version information is required.
				if (username === undefined)
				{
					let notification = { severity: 3, uuid: "987654321" };
					notification.message = "Missing or invalid username.";
					logger.error("Terminating connection due to missing username", new Error("Missing username"), {
						operation: "connectionValidation",
						remoteAddress: req.socket.remoteAddress,
						requestUrl: req.url,
						component: "wssMessageServerManager"
					});

					if (token)
					{
						ws.send(
							JSON.stringify({
								token,
								type: commands.NEW_NOTIFICATION,
								notification,
							}),
						);
						ws.send(JSON.stringify({ token, type: commands.LOGOUT }));
					}
					ws.terminate();
					return; // Exit connection handler
				}

				if (version)
				{
					const userClient = this.getUserClient(username);
					if (
						userClient &&
						userClient.connected &&
						userClient.ws.readyState === WebSocket.OPEN
					)
					{
						if (compareVersions(version, "3.7.2") < 0)
						{
							const notification = { severity: 3, uuid: "987654321" };
							notification.message =
								"Old KStars version detected. Update to 3.7.2 or higher.";
							userClient.ws.send(
								JSON.stringify({
									token,
									type: commands.NEW_NOTIFICATION,
									payload: notification,
								}),
							);
						}
						else
						{
							userClient.ws.send(
								JSON.stringify({
									type: commands.SET_KSTARS_VERSION,
									payload: version,
								}),
							);
						}
					}
				}
				if (!token || wstokenVerifier(token, secret) === false)
				{
					logger.error("Invalid token detected on message WebSocket connection", new Error("Invalid token"), {
						operation: "tokenValidation",
						username,
						remoteAddress: req.socket.remoteAddress,
						requestUrl: req.url,
						component: "wssMessageServerManager"
					});
					logger.error("Invalid token details for message WebSocket connection", new Error("Invalid token details"), {
						operation: "tokenValidation",
						username,
						tokenProvided: token,
						component: "wssMessageServerManager"
					});
					const notification = {
						severity: 3,
						message: "Session expired. Try to login.",
						uuid: "987654321",
					};
					ws.send(
						JSON.stringify({
							token,
							type: commands.NEW_NOTIFICATION,
							notification,
						}),
					);
					ws.send(JSON.stringify({ token, type: commands.LOGOUT }));
					ws.terminate(); // Terminate the connection
					return; // Exit connection handler
				}
				//////////////////////////// Ekos Section //////////////////////////////
				else if (location.pathname === "/message/ekos")
				{
					const userClient = this.getUserClient(username);
					// Update existing client if available
					const ekosClient = this.ekosClients.get(primaryID);
					if (ekosClient)
					{
						// Check if the existing client was marked as disconnected
						if (!ekosClient.connected)
						{
							logger.info(`${username}: Ekos message client is reconnecting.`);
							// Update the existing disconnected client record
							ekosClient.token = token;
							ekosClient.ws = ws;
							ekosClient.connected = true;
							ekosClient.planID = undefined; // Reset potentially stale info
							ekosClient.notificationToken = undefined; // Reset potentially stale info
							ekosClient.machineID = machineID; // Update if necessary
							ekosClient.observatoryName = observatoryName; // Update if necessary

							// Re-initialize observatory access (might be redundant but safe)
							await this.initObservatoryAccess(primaryID, username);
						}
						else
						{
							// Handle case where a new connection attempt is made for an already connected client
							logger.warn(
								`${username}: Ekos message client connected again while already marked as connected. Updating connection details.`,
							);
							// Optionally, could terminate the old ws before assigning the new one
							// ekosClient.ws?.terminate();
							ekosClient.token = token;
							ekosClient.ws = ws;
							// connected is already true
							ekosClient.planID = undefined;
							ekosClient.notificationToken = undefined;
							ekosClient.machineID = machineID;
							ekosClient.observatoryName = observatoryName;
							await this.initObservatoryAccess(primaryID, username);
						}

						// Update ekos info in database
						ekosController.saveProperty(primaryID, {
							...location.query,
							connected: true,
							token,
							lastLogged: new Date(),
							machine_id: primaryID,
						});

						// If observatory name is provided, save machine ID to observatory document
						if (observatoryName)
						{
							try
							{
								// Find the observatory by name and update its machine_id
								await ObservatoryModel.findOneAndUpdate(
									{ name: observatoryName },
									{ machine_id: primaryID },
									{ new: true },
								);
								logger.info(
									`Updated machine_id for observatory ${observatoryName}: ${primaryID}`,
								);
							}
							catch (error)
							{
								logger.error("Failed to update machine_id for observatory", error, {
									operation: "updateObservatoryMachineId",
									username,
									observatoryName,
									primaryId: primaryID,
									component: "wssMessageServerManager"
								});
							}
						}
					}
					// Otherwise create a new client
					else
					{
						let newEkosClient = {};
						newEkosClient.username = username;
						newEkosClient.token = token;
						newEkosClient.connected = true;
						newEkosClient.ws = ws;
						newEkosClient.planID = undefined;
						newEkosClient.notificationToken = undefined;
						newEkosClient.machineID = machineID;
						newEkosClient.observatoryName = observatoryName;
						this.ekosClients.set(primaryID, newEkosClient);

						// Initialize observatory access control with owner as master
						await this.initObservatoryAccess(primaryID, username);

						// Register new Ekos client in database
						ekosController.register({
							...location.query,
							machine_id: primaryID,
							lastLogged: new Date(),
						});

						// If observatory name is provided, save machine ID to observatory document
						if (observatoryName)
						{
							try
							{
								// Find the observatory by name and update its machine_id
								await ObservatoryModel.findOneAndUpdate(
									{ name: observatoryName },
									{ machine_id: primaryID },
									{ new: true },
								);
								logger.info(
									`Saved machine_id for observatory ${observatoryName}: ${primaryID}`,
								);
							}
							catch (error)
							{
								logger.error("Failed to save machine_id for observatory", error, {
									operation: "saveObservatoryMachineId",
									username,
									observatoryName,
									primaryId: primaryID,
									component: "wssMessageServerManager"
								});
							}
						}
					}

					// If we have an active user/app client connected, then we need to update the client state in Ekos to true
					if (
						userClient &&
						userClient.connected &&
						userClient.ws.readyState === WebSocket.OPEN
					)
					{
						// If the user is not connected to any Ekos instance, check if there is
						// any KStars instance for this user and connect the user to it
						const userActiveEkos = this.getActiveEkosClientIDs(username);
						if (userActiveEkos.length < 1)
						{
							const updatedUser = this.updateUserActiveKstars(
								username,
								machineID,
							);
							updatedUser.ws.send(
								JSON.stringify({
									type: commands.SET_CONNECTED_KSTARS,
									payload: primaryID,
								}),
							);
							ws.send(
								JSON.stringify({
									type: commands.SET_CLIENT_STATE,
									payload: { state: true },
								}),
							);
							userController.setConnected({ username });
							userController.saveProperty(username, { machine_id: machineID });
						}
						// Update the list of active KStars instances
						userClient.ws.send(
							JSON.stringify({
								type: commands.SET_KSTARS_MACHINE_ID,
								payload: { machineID: primaryID, observatoryName },
							}),
						);
					}

					// Ask Ekos client to send some info back to the user client
					ws.send(JSON.stringify({ type: commands.GET_CONNECTION }));
					ws.send(JSON.stringify({ type: commands.GET_DRIVERS }));
					ws.send(JSON.stringify({ type: commands.GET_SCOPES }));
					ws.send(JSON.stringify({ type: commands.GET_PROFILES }));
					ws.send(JSON.stringify({ type: commands.GET_DEVICES }));
				}
				//////////////////////////// Web Section //////////////////////////////
				else
				{
					// If a user is already logged in from else where
					// We need to disconnect them first, before we allow this one
					const userClient = this.getUserClient(username);
					if (
						userClient &&
						userClient.connected &&
						userClient.ws.readyState === WebSocket.OPEN
					)
					{
						// cleanup previous session
						userClient.ws.send(
							JSON.stringify({
								token,
								type: commands.NEW_NOTIFICATION,
								payload: {
									severity: 3,
									message: "User logged in from another location!",
									uuid: "1234",
								},
							}),
						);
						userClient.ws.send(
							JSON.stringify({ token, type: commands.LOGOUT }),
						);
						this.userClients.delete(userClient);
					}

					userController
						.setConnected({ ...location.query, lastLogged: new Date() })
						.then(() =>
						{
							let newUserClient = {};
							newUserClient.username = username;
							newUserClient.token = token;
							newUserClient.connected = true;
							newUserClient.ws = ws;
							newUserClient.state = { connected: false };
							newUserClient.machineID = machineID;
							this.userClients.add(newUserClient);

							// If there is an active assosiated Ekos Client, let's sync states as well
							const ekosClient = this.ekosClients.get(primaryID);
							if (
								ekosClient &&
								ekosClient?.connected &&
								ekosClient?.ws?.readyState === WebSocket.OPEN
							)
							{
								ekosClient.ws.send(
									JSON.stringify({
										type: commands.SET_CLIENT_STATE,
										payload: { state: true },
									}),
								);
								ws.send(
									JSON.stringify({
										type: commands.SET_CLIENT_STATE,
										payload: { state: true },
									}),
								);

								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_CONNECTION }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_DRIVERS }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_SCOPES }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_PROFILES }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_DEVICES }),
								);
								ekosController.saveProperty(primaryID, { connected: true });
								userController.saveProperty(username, {
									machine_id: ekosClient.machineID,
								});
							}
							else
							{
								// Ekos client is not connected to the server.
								ws.send(
									JSON.stringify({
										type: commands.SET_CLIENT_STATE,
										payload: { state: false },
									}),
								);
								ekosController.saveProperty(primaryID, { connected: false });
							}
						})
						.catch((err) =>
						{
							const notification = {
								severity: 3,
								message: "Error in registeration: " + err,
								uuid: "9876",
							};
							ws.send(
								JSON.stringify({
									token,
									type: commands.NEW_NOTIFICATION,
									payload: notification,
								}),
							);
							ws.send(
								JSON.stringify({ token, type: commands.LOGOUT, payload: {} }),
							);
							userController.saveProperty(username, { connected: false });
							userController.saveProperty(username, { machine_id: "null" });
						});
				}
			}
			catch (error)
			{
				// End of initial setup try block
				logger.error("Error during initial WebSocket connection setup (wssMessageServerManager)", error, {
					operation: "websocketConnectionSetup",
					remoteAddress: req.socket.remoteAddress,
					requestUrl: req.url,
					component: "wssMessageServerManager"
				});
				try
				{
					ws.terminate();
				}
				catch (e)
				{
					logger.error("Failed to terminate WebSocket after setup error", e, {
						operation: "terminateWebSocket",
						remoteAddress: req.socket.remoteAddress,
						requestUrl: req.url,
						component: "wssMessageServerManager"
					});
				}
				return; // Stop further processing for this connection
			}

			// Attach event listeners *outside* the initial try/catch
			///////////////////////////////// Messages ////////////////////////////////
			ws.on("message", async (message) =>
			{
				try
				{
					// Wrap message handler logic
					let msg = JSON.parse(message);
					const currentToken = location.query.token; // Use token from connection closure

					// Re-verify token for each message
					if (
						!currentToken ||
						wstokenVerifier(currentToken, secret) === false
					)
					{
						logger.error("Invalid token detected during message processing, terminating session", new Error("Invalid token"), {
							operation: "tokenValidation",
							username,
							tokenUsed: currentToken,
							remoteAddress: req.socket.remoteAddress,
							requestUrl: req.url,
							component: "wssMessageServerManager"
						});
						const notification = {
							severity: 3,
							message: "Session expired. Try to login.",
							uuid: "987654321",
						};
						ws.send(
							JSON.stringify({
								token: currentToken, // Send the invalid token back if available
								type: commands.NEW_NOTIFICATION,
								notification,
							}),
						);
						ws.send(JSON.stringify({ type: commands.LOGOUT }));
						ws.terminate(); // Terminate on invalid token
						return;
					}
					////////////////////////////// Messages from Ekos /////////////////////////
					else if (location.pathname === "/message/ekos")
					{
						// In case ekos just came online, ask it to send equipment and state updates.
						if (
							msg.type === commands.NEW_CONNECTION_STATE &&
							msg.payload.online
						)
						{
							ws.send(JSON.stringify({ type: commands.GET_CAMERAS }));
							ws.send(JSON.stringify({ type: commands.GET_MOUNTS }));
							ws.send(JSON.stringify({ type: commands.GET_SCOPES }));
							ws.send(JSON.stringify({ type: commands.GET_FILTER_WHEELS }));
							ws.send(JSON.stringify({ type: commands.GET_DOMES }));
							ws.send(JSON.stringify({ type: commands.GET_CAPS }));
							ws.send(JSON.stringify({ type: commands.GET_STATES }));
						}

						// Broadcast the message to all users with access to this observatory
						const observatoryUsers = this.getObservatoryUsers(primaryID);

						// Handle notifications specially
						if (msg.type === commands.NEW_NOTIFICATION)
						{
							try
							{
								const user = await this.#getUser(username);
								const notification = await NotificationModel.create({
									type: msg.payload.source,
									severity: msg.payload.severity,
									content: msg.payload.message,
									target_users: [user.socialAccount._id],
									read_users: [],
									channel: "EKOS",
									role: "REGISTERED",
									actions: [],
								});

								// Send notification to all users with access
								for (const observatoryUser of observatoryUsers)
								{
									try
									{
										this.sendMessageByUsername(observatoryUser, {
											notification,
											type: "new_unread_notification",
										});
									}
									catch (error)
									{
										logger.error("Failed to send notification to user", error, {
											operation: "sendNotificationToUser",
											username,
											primaryId: primaryID,
											targetUser: observatoryUser,
											component: "wssMessageServerManager"
										});
									}
								}
							}
							catch (error)
							{
								logger.error("Error processing NEW_NOTIFICATION from Ekos", error, {
									operation: "processNewNotification",
									username,
									primaryId: primaryID,
									component: "wssMessageServerManager"
								});
							}
						}
						else
						{
							// Broadcast regular messages to all users with access
							for (const observatoryUser of observatoryUsers)
							{
								try
								{
									const userClient = this.getUserClient(observatoryUser);
									if (
										userClient &&
										userClient.connected &&
										userClient.machineID === primaryID &&
										userClient.ws.readyState === WebSocket.OPEN
									)
									{
										userClient.ws.send(
											JSON.stringify({ type: msg.type, payload: msg.payload }),
										);
									}
								}
								catch (error)
								{
									logger.error("Failed to broadcast message to user for observatory", error, {
										operation: "broadcastMessage",
										username,
										primaryId: primaryID,
										targetUser: observatoryUser,
										messageType: msg.type,
										component: "wssMessageServerManager"
									});
								}
							}
						}
					}
					////////////////////////////// Messages from Web /////////////////////////
					else
					{
						if (msg.type === commands.SET_ACTIVE_KSTARS_CONNECTION)
						{
							// Update machineID for userClient and client state in the ekos
							// this.updateUserActiveKstars(username, msg.payload);
							const ekosClient = this.ekosClients.get(msg.payload);
							if (
								ekosClient &&
								ekosClient.connected &&
								ekosClient.ws.readyState === WebSocket.OPEN
							)
							{
								ekosClient.ws.send(
									JSON.stringify({
										type: commands.SET_CLIENT_STATE,
										payload: { state: true },
									}),
								);

								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_CONNECTION }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_DRIVERS }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_SCOPES }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_PROFILES }),
								);
								ekosClient.ws.send(
									JSON.stringify({ type: commands.GET_DEVICES }),
								);
								userController.saveProperty(username, {
									machine_id: ekosClient.machineID,
								});
							}
						}
						else if (msg.type === commands.GET_CONNECTED_KSTARS)
						{
							// Send to the client active KStars connections
							const activeIDS = this.getActiveEkosClientIDs(username);
							ws.send(
								JSON.stringify({
									type: commands.SET_CONNECTED_KSTARS,
									payload: activeIDS,
								}),
							);
							userController.saveProperty(username, { machine_id: primaryID });
						}
						else if (msg.type === commands.SET_OBSERVATORY_ACCESS)
						{
							// Handle setting observatory access
							const { machineID, targetUsername, role } = msg.payload;

							if (this.getUserRole(username, machineID) === "master")
							{
								try
								{
									// Only the master can set access
									const success = await this.addUserAccess(
										targetUsername,
										machineID,
										role,
									);

									if (success)
									{
										// Notify all users with access about the change
										const observatoryUsers =
											this.getObservatoryUsers(machineID);
										for (const observatoryUser of observatoryUsers)
										{
											const userClient = this.getUserClient(observatoryUser);
											if (
												userClient &&
												userClient.connected &&
												userClient.ws.readyState === WebSocket.OPEN
											)
											{
												userClient.ws.send(
													JSON.stringify({
														type: commands.OBSERVATORY_ACCESS_CHANGED,
														payload: {
															machineID,
															users: Array.from(
																this.observatoryAccess
																	.get(machineID)
																	.accessList.entries(),
															).map(([username, role]) => ({ username, role })),
														},
													}),
												);
											}
										}

										// Send success response to the requester
										ws.send(
											JSON.stringify({
												type: commands.SET_OBSERVATORY_ACCESS,
												payload: { success: true },
											}),
										);
									}
									else
									{
										// Send failure response
										ws.send(
											JSON.stringify({
												type: commands.SET_OBSERVATORY_ACCESS,
												payload: {
													success: false,
													message: "Failed to set observatory access",
												},
											}),
										);
									}
								}
								catch (error)
								{
									logger.error(
										"Error setting observatory access",
										error,
										{
											operation: "SET_OBSERVATORY_ACCESS",
											username,
											machineID,
											targetUser: targetUsername,
											role,
											component: "wssMessageServerManager"
										}
									);
									// Send error response
									ws.send(
										JSON.stringify({
											type: commands.SET_OBSERVATORY_ACCESS,
											payload: {
												success: false,
												message: `Error setting observatory access: ${error.message}`,
											},
										}),
									);
								}
							}
							else
							{
								// Send permission denied response
								ws.send(
									JSON.stringify({
										type: commands.SET_OBSERVATORY_ACCESS,
										payload: {
											success: false,
											message:
												"Permission denied: Only the master can set access",
										},
									}),
								);
							}
						}
						else if (msg.type === commands.GET_OBSERVATORY_ACCESS)
						{
							// Handle getting observatory access list
							const machineID = msg.payload.machineID || userClient.machineID;

							if (this.observatoryAccess.has(machineID))
							{
								const access = this.observatoryAccess.get(machineID);
								ws.send(
									JSON.stringify({
										type: commands.GET_OBSERVATORY_ACCESS,
										payload: {
											machineID,
											users: Array.from(access.accessList.entries()).map(
												([username, role]) => ({ username, role }),
											),
										},
									}),
								);
							}
							else
							{
								ws.send(
									JSON.stringify({
										type: commands.GET_OBSERVATORY_ACCESS,
										payload: {
											machineID,
											users: [],
											message: "Observatory not found",
										},
									}),
								);
							}
						}
						else if (msg.type === commands.SET_OBSERVATORY_CONTROLLER)
						{
							// Handle setting observatory controller
							const { machineID, controllerUsername } = msg.payload;

							// Check if the requester has permission to change controller
							const requesterRole = this.getUserRole(username, machineID);
							if (requesterRole === "master")
							{
								try
								{
									// Master can set any user as controller
									const success = await this.setCurrentController(
										controllerUsername,
										machineID,
									);

									if (success)
									{
										// Notify all users with access about the controller change
										const observatoryUsers =
											this.getObservatoryUsers(machineID);
										for (const observatoryUser of observatoryUsers)
										{
											const userClient = this.getUserClient(observatoryUser);
											if (
												userClient &&
												userClient.connected &&
												userClient.ws.readyState === WebSocket.OPEN
											)
											{
												userClient.ws.send(
													JSON.stringify({
														type: commands.OBSERVATORY_CONTROLLER_CHANGED,
														payload: {
															machineID,
															controller: controllerUsername,
														},
													}),
												);
											}
										}

										// Send success response
										ws.send(
											JSON.stringify({
												type: commands.SET_OBSERVATORY_CONTROLLER,
												payload: { success: true },
											}),
										);
									}
									else
									{
										// Send failure response
										ws.send(
											JSON.stringify({
												type: commands.SET_OBSERVATORY_CONTROLLER,
												payload: {
													success: false,
													message: "Failed to set controller",
												},
											}),
										);
									}
								}
								catch (error)
								{
									logger.error(
										"Error setting observatory controller",
										error,
										{
											operation: "SET_OBSERVATORY_CONTROLLER",
											username,
											machineID,
											controllerUsername,
											component: "wssMessageServerManager"
										}
									);
									// Send error response
									ws.send(
										JSON.stringify({
											type: commands.SET_OBSERVATORY_CONTROLLER,
											payload: {
												success: false,
												message: `Error setting observatory controller: ${error.message}`,
											},
										}),
									);
								}
							}
							else
							{
								// Send permission denied response
								ws.send(
									JSON.stringify({
										type: commands.SET_OBSERVATORY_CONTROLLER,
										payload: {
											success: false,
											message:
												"Permission denied: Only the master can change controller",
										},
									}),
								);
							}
						}
						else if (msg.type === commands.GET_OBSERVATORY_CONTROLLER)
						{
							// Handle getting observatory controller
							const machineID = msg.payload.machineID || userClient.machineID;

							const controller = this.getCurrentController(machineID);
							ws.send(
								JSON.stringify({
									type: commands.GET_OBSERVATORY_CONTROLLER,
									payload: {
										machineID,
										controller,
									},
								}),
							);
						}
						else
						{
							// For all other messages, check if user can control the observatory
							const userClient = this.getUserClient(username);
							if (userClient)
							{
								const machineID = userClient.machineID;
								const ekosClient = this.ekosClients.get(machineID);

								if (
									ekosClient &&
									ekosClient?.connected &&
									ekosClient?.ws?.readyState === WebSocket.OPEN
								)
								{
									// Check if user has control permission (async function)
									this.canUserControl(username, machineID)
										.then((canControl) =>
										{
											if (canControl)
											{
												try
												{
													// Forward the command to the observatory
													ekosClient.ws.send(
														JSON.stringify({
															type: msg.type,
															payload: msg.payload,
														}),
													);
												}
												catch (sendError)
												{
													logger.error(
														"Error sending command from user to observatory",
														sendError,
														{
															operation: "FORWARD_COMMAND",
															username,
															machineID,
															commandType: msg.type,
															component: "wssMessageServerManager"
														}
													);
													// Optionally notify the user about the send failure
													ws.send(
														JSON.stringify({
															type: commands.NEW_NOTIFICATION,
															payload: {
																severity: 3,
																message: `Failed to send command to observatory: ${sendError.message}`,
																uuid: "send_command_error",
															},
														}),
													);
												}
											}
											else
											{
												// Send permission denied notification
												ws.send(
													JSON.stringify({
														type: commands.NEW_NOTIFICATION,
														payload: {
															severity: 3,
															message:
																"You do not have control permission for this observatory",
															uuid: "permission_denied",
														},
													}),
												);
												logger.warn(
													`User ${username} denied control permission for observatory ${machineID}`,
												);
											}
										})
										.catch((error) =>
										{
											logger.error(
												"Error checking control permission",
												error,
												{
													operation: "CHECK_CONTROL_PERMISSION",
													username,
													machineID,
													component: "wssMessageServerManager"
												}
											);
											// Send error notification
											ws.send(
												JSON.stringify({
													type: commands.NEW_NOTIFICATION,
													payload: {
														severity: 3,
														message: "Error checking control permission",
														uuid: "permission_error",
													},
												}),
											);
										});
								}
							}
						}
					}
				}
				catch (msgError)
				{
					// End of try block for message handler
					logger.error(
						"Error processing message",
						msgError,
						{
							operation: "PROCESS_MESSAGE",
							username,
							primaryID,
							component: "wssMessageServerManager"
						}
					);
					// Decide if the connection should be terminated based on the error
					if (msgError instanceof SyntaxError)
					{
						// e.g., Invalid JSON
						// Maybe just log and ignore, or notify client
					}
					else
					{
						// For other errors, maybe terminate
						// ws.terminate();
					}
				}
			});

			///////////////////////////////// Close ////////////////////////////////
			ws.on("close", () =>
			{
				try
				{
					// Wrap close handler logic
					///////////////////////////////// 1. Ekos Client Closing ////////////////////////////////
					if (location.pathname === "/message/ekos")
					{
						const ekosClient = this.ekosClients.get(primaryID);
						if (ekosClient)
						{
							logger.info(
								`${username}: Ekos message client disconnected from websocket server.`,
							);
							// Mark as disconnected instead of deleting
							ekosClient.connected = false;
							ekosClient.ws = null;
							// Keep the client entry in the map: this.ekosClients.delete(primaryID);

							ekosController.saveProperty(primaryID, { connected: false });
							const userClient = this.getUserClient(username, primaryID); // Use primaryID here
							if (
								userClient &&
								userClient.connected &&
								userClient.ws.readyState === WebSocket.OPEN
							)
							{
								// In case the active KStars is disconnected, update the state for the user
								if (userClient.machineID === primaryID)
								{
									userClient.ws.send(
										JSON.stringify({
											type: commands.NEW_CONNECTION_STATE,
											payload: { connected: false, online: false },
										}),
									);
								}
								// Update user client machine id list
								this.deleteUserActiveKstars(primaryID);
								userClient.ws.send(
									JSON.stringify({
										type: commands.DELETE_KSTAR_CONNECTION,
										payload: primaryID,
									}),
								);
								userController.saveProperty(username, { machine_id: "null" });

								// Check if the user has any other KStars connected, if so connect them to it
								const userActiveKStars = this.getActiveEkosClientIDs(username);
								if (userActiveKStars.length > 0 && userActiveKStars[0])
								{
									const nextEkosClient = this.ekosClients.get(
										userActiveKStars[0].machineID,
									);
									if (nextEkosClient)
									{
										// Ensure the next client exists
										this.updateUserActiveKstars(
											username,
											nextEkosClient.machineID,
										);
										userClient.ws.send(
											JSON.stringify({
												type: commands.SET_CONNECTED_KSTARS,
												payload: nextEkosClient.machineID,
											}),
										);
										userController.saveProperty(username, {
											machine_id: nextEkosClient.machineID,
										});

										if (
											nextEkosClient.ws &&
											nextEkosClient.ws.readyState === WebSocket.OPEN
										)
										{
											nextEkosClient.ws.send(
												JSON.stringify({ type: commands.GET_CONNECTION }),
											);
											nextEkosClient.ws.send(
												JSON.stringify({ type: commands.GET_DRIVERS }),
											);
											nextEkosClient.ws.send(
												JSON.stringify({ type: commands.GET_SCOPES }),
											);
											nextEkosClient.ws.send(
												JSON.stringify({ type: commands.GET_PROFILES }),
											);
											nextEkosClient.ws.send(
												JSON.stringify({ type: commands.GET_DEVICES }),
											);
										}
									}
								}
							}
						}
					}
					///////////////////////////////// 2. Web Client Closing ////////////////////////////////
					else
					{
						userController.saveProperty(username, { connected: false });

						const userClient = this.getUserClient(username);
						if (userClient)
						{
							const ekosClient = this.getEkosClientByUser(userClient.username);
							if (ekosClient)
							{
								if (
									ekosClient.connected &&
									ekosClient.ws?.readyState === WebSocket.OPEN // Add null check for ws
								)
								{
									ekosClient.ws.send(
										JSON.stringify({
											type: commands.SET_CLIENT_STATE,
											payload: { state: false },
										}),
									);
								}
							}
							logger.info(
								`${username}: Web message client disconnected from websocket server.`,
							);
							this.userClients.delete(userClient);
							userController.saveProperty(username, { machine_id: "null" });
						}
					}
				}
				catch (closeError)
				{
					// End of try block for close handler
					logger.error(
						"Error during WebSocket close handling",
						closeError,
						{
							operation: "WEBSOCKET_CLOSE",
							username,
							primaryID,
							component: "wssMessageServerManager"
						}
					);
				}
			});
		});
	}

	/**
	 * Sends a message to a specific user and awaits a response message of a matching type.
	 * @param {string} username - The username of the user.
	 * @param {object} message - The message object to be sent. The message object should have a 'type' property.
	 * @returns {Promise<any>} A promise that resolves with the payload of the response message (if successful), or rejects with an error message.
	 * @throws {Error} - Rejects with an error message if the user is not found or there's an issue with message sending or receiving.
	 */
	sendMessageAndAwaitResponse(username, message)
	{
		return new Promise((resolve, reject) =>
		{
			const userClient = this.getUserClient(username);
			const ekosClient = this.getEkosClientByUser(username);
			if (!userClient)
				return reject(
					"Unable to find an active user matching the provided username",
				); // Use return reject
			if (!ekosClient || !ekosClient.ws)
				// Check if ekosClient or its ws is null/undefined
				return reject(
					"Unable to find an active KStars instance or connection for the provided username",
				);

			const handleMessage = (event) =>
			{
				try
				{
					// Add try-catch for JSON parsing
					let msg = JSON.parse(event);
					if (msg?.type === message.type)
					{
						ekosClient.ws.removeListener("message", handleMessage);
						resolve(msg.payload);
					}
				}
				catch (parseError)
				{
					logger.error(
						"Error parsing response message in sendMessageAndAwaitResponse",
						parseError,
						{
							operation: "PARSE_RESPONSE_MESSAGE",
							username,
							messageType: message.type,
							component: "wssMessageServerManager"
						}
					);
					// Optionally reject or ignore based on requirements
				}
			};

			// Add error listener for the specific response expectation
			const handleError = (err) =>
			{
				logger.error(
					"WebSocket error while awaiting response",
					err,
					{
						operation: "AWAIT_RESPONSE",
						username,
						messageType: message.type,
						component: "wssMessageServerManager"
					}
				);
				ekosClient.ws.removeListener("message", handleMessage);
				ekosClient.ws.removeListener("error", handleError); // Clean up error listener
				reject(`WebSocket error occurred: ${err.message}`);
			};

			ekosClient.ws.addListener("message", handleMessage);
			ekosClient.ws.addListener("error", handleError); // Add error listener

			// Send the message
			try
			{
				ekosClient.ws.send(JSON.stringify(message));
			}
			catch (sendError)
			{
				logger.error(
					"Failed to send message in sendMessageAndAwaitResponse",
					sendError,
					{
						operation: "SEND_MESSAGE_AWAIT_RESPONSE",
						username,
						messageType: message.type,
						component: "wssMessageServerManager"
					}
				);
				ekosClient.ws.removeListener("message", handleMessage);
				ekosClient.ws.removeListener("error", handleError);
				reject(`Failed to send message: ${sendError.message}`);
			}

			// Optional: Add a timeout for the response
			const timeoutId = setTimeout(() =>
			{
				ekosClient.ws.removeListener("message", handleMessage);
				ekosClient.ws.removeListener("error", handleError);
				reject(`Timeout waiting for response message type: ${message.type}`);
			}, 30000); // 30 second timeout

			// Ensure timeout is cleared if response arrives or error occurs
			const cleanup = () => clearTimeout(timeoutId);
			ekosClient.ws.once("message", cleanup); // Use once for cleanup
			ekosClient.ws.once("error", cleanup);
		});
	}

	/**
	 *
	 * @param {string} username - Username.
	 * @param {{type: string, payload: *}} message - Message for the client.
	 * @throws {Error} - Throw an error when user is not found or ws is not open.
	 */
	sendMessageByUsername(username, message)
	{
		const userClient = this.getUserClient(username);
		if (!userClient)
			throw new Error(
				`Unable to find an active user matching the provided username: ${username}`,
			);

		if (userClient.ws && userClient.ws.readyState === WebSocket.OPEN)
		{
			try
			{
				userClient.ws.send(JSON.stringify(message));
			}
			catch (sendError)
			{
				logger.error(
					"Failed to send message to user",
					sendError,
					{
						operation: "SEND_MESSAGE_BY_USERNAMES",
						username: userClient.username,
						component: "wssMessageServerManager"
					}
				);
			}
		}
		else
		{
			throw new Error(`WebSocket connection not open for user: ${username}`);
		}
	}

	/**
	 *
	 * @param {string[]} usernames - Array of usernames.
	 * @param {{type: string, payload: *}} message - Message for the client.
	 */
	sendMessageByUsernames(usernames, message)
	{
		const messageString = JSON.stringify(message); // Stringify once
		this.userClients.forEach((userClient) =>
		{
			if (!usernames.includes(userClient.username)) return;

			if (
				userClient.connected &&
				userClient.ws?.readyState === WebSocket.OPEN
			)
			{
				// Add null check for ws
				try
				{
					userClient.ws.send(messageString);
				}
				catch (sendError)
				{
					logger.error(
						"Failed to send message to user",
						sendError,
						{
							operation: "SEND_MESSAGE_BY_USERNAMES",
							username: userClient.username,
							component: "wssMessageServerManager"
						}
					);
				}
			}
		});
	}
}

module.exports = wssMessageServerManager;
