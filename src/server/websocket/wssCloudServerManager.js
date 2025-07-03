const url = require("url");
const WebSocket = require("ws");
const wstokenVerifier = require("../auth/ws-token-verifier");
const cloudController = require("../controller/cloud");
const cloudModel = require("../models/cloud");
const UserModel = require("../models/user");
const Minio = require("minio");
const { s3AccessKey, s3SecretKey, secret, s3Instance } = require("../config");
const {
	max_basic_storage,
	max_pro_storage,
	max_ultimate_storage,
} = require("../shared");
const { compareVersions } = require("compare-versions");
const logger = require("../logger");
const commands = require("../../../StellarMateShared/shared/commands");
const { isEmpty, get } = require("lodash");
const wssBaseManager = require("./wssBaseManager");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs"); // For existsSync, readFileSync

//const METADATA_MAX_SIZE = 3000;
const METADATA_PACKET = 2048;

const minioClient = new Minio.Client({
	endPoint: "s3.amazonaws.com",
	useSSL: true,
	accessKey: s3AccessKey,
	secretKey: s3SecretKey,
});

class wssCloudServerManager extends wssBaseManager
{
	constructor(
		server,
		wssMessageManager, // Removed wssMediaServerManager
	)
	{
		super(server);
		this.wssMessageManager = wssMessageManager;
		// this.mediaManager = wssMediaServerManager; // Removed
	}

	listen()
	{
		// Global WebSocket server error handler
		this.wss.on("error", (error) =>
		{
			logger.error("WebSocket Server Error", error, {
				operation: "websocket_server_error",
				component: "wssCloudServerManager"
			});
		});

		this.wss.on("connection", (ws, req) =>
		{
			// Declare variables needed in outer scope
			let location,
				username,
				primaryID,
				token,
				storage = 0,
				plan_id = 2;

			try
			{
				// Wrap initial connection setup logic
				location = url.parse(req.url, true);

				const version = location.query.version;
				username = location.query.username; // Assign to outer scope
				token = location.query.token; // Assign to outer scope
				// Ensure we always have a valid machine ID by using username as fallback
				const machineID =
					location.query.machine_id && location.query.machine_id !== "undefined"
						? location.query.machine_id
						: username;
				// primaryID should never be null/undefined since we always have username
				primaryID = machineID; // Assign to outer scope
				const observatoryName = location.query.observatory ?? null;

				// Ekos version information is required.
				if (username === undefined)
				{
					let notification = { severity: 3, uuid: "987654321" };
					notification.message = "Missing or invalid username.";
					logger.error("Terminating connection due to missing username", new Error("Missing username"), {
						operation: "websocket_connection",
						component: "wssCloudServerManager"
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

				// Check storage from cloud collection (uses username) - Added .catch()
				cloudModel
					.findOne({ username }, "storage")
					.then((ekos) =>
					{
						if (ekos) storage = ekos.storage;
					})
					.catch((err) =>
					{
						logger.error("Failed to fetch initial storage for cloud", err, {
							operation: "fetchInitialStorage",
							username,
							component: "wssCloudServerManager"
						});
						// Decide how to proceed - maybe assume 0 storage or terminate connection
						// For now, we'll proceed assuming 0 storage.
						storage = 0;
					});

				if (!token || wstokenVerifier(token, secret) === false)
				{
					logger.error("Invalid token detected on cloud WebSocket connection", new Error("Invalid token"), {
						operation: "tokenVerification",
						username,
						component: "wssCloudServerManager"
					});
					logger.error("Token details for cloud WebSocket connection", new Error("Token validation failed"), {
						operation: "tokenVerification",
						username,
						token,
						component: "wssCloudServerManager"
					});
					const notification = {
						severity: 3,
						message: "Session expired. Try to login.",
						uuid: "987654321",
					};
					// Use message manager if available, otherwise try sending directly
					if (this.wssMessageManager)
					{
						this.wssMessageManager.sendUserNotification(username, notification);
					}
					else
					{
						try
						{
							ws.send(
								JSON.stringify({
									type: commands.NEW_NOTIFICATION,
									payload: notification,
								}),
							);
						}
						catch (e)
						{}
					}
					try
					{
						ws.send(JSON.stringify({ type: commands.LOGOUT, payload: {} }));
					}
					catch (e)
					{}
					ws.terminate();
					return; // Exit connection handler
				}
				////////////////////////////////// Ekos Client Connection ////////////////////////////////
				else if (location.pathname === "/cloud/ekos")
				{
					// Only EkosLive Pro and Ultimate is supported.
					// if (plan_id === 2)
					// {
					// 	const message = "Plan id " + plan_id + " is not supported";
					// 	ws.send(
					// 		JSON.stringify({ type: commands.LOGOUT, payload: { message } }),
					// 	);
					// 	return;
					// }

					// Fetch user from DB to get persisted ekosLiveCloudEnabled setting
					UserModel.findOne({ username: username })
						.then((userFromDB) =>
						{
							if (!userFromDB)
							{
								logger.error("User not found in database during Ekos connection", new Error("User not found"), {
									operation: "userLookup",
									username,
									component: "wssCloudServerManager"
								});
								ws.terminate();
								return;
							}

							// All plans can enable cloud. Quota is the differentiator.
							let initialCloudEnabled =
								userFromDB.ekosLiveCloudEnabled || false;
							plan_id = Number(
								userFromDB.plan_id || location.query.plan_id || "2",
							); // Use plan_id from DB or query

							const existingEkosClient = this.ekosClients.get(primaryID);
							if (existingEkosClient)
							{
								if (!existingEkosClient.connected)
								{
									logger.info(
										`${username}: Ekos cloud client is reconnecting.`,
									);
									existingEkosClient.token = token;
									existingEkosClient.ws = ws;
									existingEkosClient.connected = true;
									existingEkosClient.machineID = machineID;
									existingEkosClient.observatoryName = observatoryName;
									existingEkosClient.cloudEnabled = initialCloudEnabled; // Use DB value
									existingEkosClient.metadata = {};
									this.initObservatoryAccess(primaryID, username);
								}
								else
								{
									logger.warn(
										`${username}: Ekos cloud client connected again while already marked as connected. Updating.`,
									);
									existingEkosClient.token = token;
									existingEkosClient.ws = ws;
									existingEkosClient.machineID = machineID;
									existingEkosClient.observatoryName = observatoryName;
									existingEkosClient.cloudEnabled = initialCloudEnabled; // Use DB value
									existingEkosClient.metadata = {};
									this.initObservatoryAccess(primaryID, username);
								}
								cloudController.saveProperty(existingEkosClient.username, {
									connected: true,
									token: token,
									lastLogged: new Date(),
								});
								// Inform KStars of the current cloud status from DB
								if (
									existingEkosClient.connected &&
									existingEkosClient.ws &&
									existingEkosClient.ws.readyState === WebSocket.OPEN
								)
								{
									try
									{
										existingEkosClient.ws.send(
											JSON.stringify({
												type: commands.SET_CLOUD_ENABLED_STATUS,
												payload: {
													cloudEnabled: existingEkosClient.cloudEnabled,
												},
											}),
										);
									}
									catch (e)
									{
										logger.error("Error sending SET_CLOUD_ENABLED_STATUS to KStars on reconnect", e, {
											operation: "sendCloudStatus",
											username,
											component: "wssCloudServerManager"
										});
									}
								}
							}
							else
							{
								let newEkosClient = {
									username: username,
									token: token,
									connected: true,
									ws: ws,
									cloudEnabled: initialCloudEnabled, // Use DB value
									metadata: {},
									machineID: machineID,
									observatoryName: observatoryName,
								};
								this.ekosClients.set(primaryID, newEkosClient);
								this.initObservatoryAccess(primaryID, username);
								cloudController.register({
									...location.query, // Keep other query params if any
									username: username,
									lastLogged: new Date(),
									plan_id: plan_id, // Ensure plan_id is part of registration if needed
									ekosLiveCloudEnabled: initialCloudEnabled, // Store initial state if relevant for cloudController
								});
								// Inform KStars of the current cloud status from DB
								if (
									newEkosClient.connected &&
									newEkosClient.ws &&
									newEkosClient.ws.readyState === WebSocket.OPEN
								)
								{
									try
									{
										newEkosClient.ws.send(
											JSON.stringify({
												type: commands.SET_CLOUD_ENABLED_STATUS,
												payload: { cloudEnabled: newEkosClient.cloudEnabled },
											}),
										);
									}
									catch (e)
									{
										logger.error("Error sending SET_CLOUD_ENABLED_STATUS to KStars on new connection", e, {
											operation: "sendCloudStatus",
											username,
											component: "wssCloudServerManager"
										});
									}
								}
							}
						})
						.catch((err) =>
						{
							logger.error("Error fetching user from database", err, {
								operation: "userLookup",
								username,
								component: "wssCloudServerManager"
							});
							ws.terminate();
						});
				}
				////////////////////////////////// Web Client Connection ////////////////////////////////
				else
				{
					let newUserClient = {};
					newUserClient.username = username;
					newUserClient.token = token;
					newUserClient.connected = true;
					newUserClient.ws = ws;
					newUserClient.state = { connected: false };
					newUserClient.machineID = machineID;
					this.userClients.add(newUserClient);
				}
			}
			catch (error)
			{
				// End of initial setup try block
				logger.error("Error during initial WebSocket connection setup", error, {
					operation: "websocket_setup",
					username,
					component: "wssCloudServerManager"
				});
				try
				{
					ws.terminate();
				}
				catch (e)
				{
					logger.error("Failed to terminate WebSocket after setup error", e, {
						operation: "websocket_cleanup",
						username,
						component: "wssCloudServerManager"
					});
				}
				return; // Stop further processing for this connection
			}

			// Attach event listeners *outside* the initial try/catch
			////////////////////////////////// Messages ////////////////////////////////
			ws.on("message", async (message) =>
			{
				try
				{
					// Wrap message handler logic
					const currentToken = location.query.token; // Use token from connection closure
					// Re-verify token for each message
					if (
						!currentToken ||
						wstokenVerifier(currentToken, secret) === false
					)
					{
						logger.error("Invalid token detected during message processing", new Error("Invalid token"), {
							operation: "messageTokenVerification",
							username,
							component: "wssCloudServerManager"
						});
						const notification = {
							severity: 3,
							message: "Session expired. Try to login.",
							uuid: "987654321",
						};
						if (this.wssMessageManager)
						{
							this.wssMessageManager.sendUserNotification(
								username,
								notification,
							);
						}
						else
						{
							try
							{
								ws.send(
									JSON.stringify({
										type: commands.NEW_NOTIFICATION,
										payload: notification,
									}),
								);
							}
							catch (e)
							{}
						}
						try
						{
							ws.send(JSON.stringify({ type: commands.LOGOUT, payload: {} }));
						}
						catch (e)
						{}
						ws.terminate(); // Terminate on invalid token
						return;
					}
					////////////////////////////////// Ekos Client Messages ////////////////////////////////
					else if (location.pathname === "/cloud/ekos")
					{
						// Wrap the entire Ekos message handling in a nested try...catch for specific cloud logic errors
						try
						{
							const ekosClient = this.ekosClients.get(primaryID);
							logger.debug(
								`${username}: Received Ekos cloud message. Ekos Client OK? ${ekosClient ? "Yes" : "No"} Cloud enabled? ${ekosClient?.cloudEnabled ? "Yes" : "No"}`,
							);

							// If no ekosClient or cloud not enabled, exit early
							if (!ekosClient || !ekosClient.cloudEnabled)
							{
								logger.debug(
									`${username}: Ignoring cloud message - client not ready or cloud disabled`,
								);
								return;
							}

							// Handle text messages
							if (typeof message === "string")
							{
								logger.debug(`${username}: Ignoring cloud message ${message}`);
								return;
							}

							// Handle binary messages
							logger.debug(
								`${username}: Received binary message size ${message.length} bytes.`,
							);

							// Get plan ID and determine storage limits
							plan_id = Number(get(location.query, "plan_id", "2")); // 2 is the basic plan id

							// Get max storage based on plan
							const getMaxStorage = (planId) =>
							{
								switch (planId)
								{
									case 2:
										return max_basic_storage;
									case 1:
									case 4:
										return max_pro_storage;
									case 3:
									case 5:
										return max_ultimate_storage;
									default:
										return max_basic_storage;
								}
							};

							const maxStorage = getMaxStorage(plan_id);
							// const userClient = this.getUserClient(username); // userClient might not be needed here
							storage += message.length; // Use storage from outer scope

							// Calculate usage percentage
							const usagePercentage = (storage / maxStorage) * 100;

							// Check if storage exceeds limit
							if (storage > maxStorage)
							{
								try
								{
									// Warn user that storage is over
									const notification = {
										severity: 3,
										message: `Cloud storage limit for your subscription plan (${storage} bytes) has been reached!`,
										uuid: "12345678",
									};
									this.wssMessageManager.sendUserNotification(
										username,
										notification,
									);

									logger.info(
										`${username}: Cloud storage limit (${storage}) exceeded subscription plan limit. Disabling blobs.`,
									);

									// Disable BLOBS as Ekos size
									ws.send(
										JSON.stringify({
											token: currentToken,
											type: commands.SET_BLOBS,
											payload: false,
										}),
									);
								}
								catch (sendError)
								{
									logger.error("Error sending storage limit notification or SET_BLOBS command", sendError, {
										operation: "sendStorageLimitNotification",
										username,
										component: "wssCloudServerManager"
									});
								}
								return; // Exit early
							}
							// Check if storage is at 90% or more but less than 100%
							else if (usagePercentage >= 90 && usagePercentage < 100)
							{
								try
								{
									// Warn user that storage is approaching limit
									const notification = {
										severity: 2, // Warning level
										message: `Warning: You've used ${Math.round(usagePercentage)}% of your cloud storage limit!`,
										uuid: "90percentwarning",
									};
									this.wssMessageManager.sendUserNotification(
										username,
										notification,
									);

									logger.info(
										`${username}: Cloud storage usage at ${Math.round(usagePercentage)}% of subscription plan limit.`,
									);
								}
								catch (sendError)
								{
									logger.error("Error sending storage warning notification", sendError, {
										operation: "sendStorageWarningNotification",
										username,
										component: "wssCloudServerManager"
									});
								}
							}

							// Extract and parse metadata
							let metadata;
							try
							{
								let metadataBuffer = message.slice(0, METADATA_PACKET);
								metadataBuffer = metadataBuffer.filter((i) => i !== 0);
								metadataBuffer = metadataBuffer.toString("utf-8");
								metadata = JSON.parse(metadataBuffer);
								logger.info(
									`${username}: Successfully parsed metadata for UUID: ${metadata.uuid}`,
								);

								// Handle special case for OPTION_SET
								if (!("uuid" in metadata) || isEmpty(metadata.uuid))
								{
									if (metadata?.type === commands.OPTION_SET)
									{
										try
										{
											logger.debug(
												`${username}: Processing OPTION_SET command`,
											);
											this.wssMessageManager.sendMessageByUsername(
												username,
												metadata,
											);
										}
										catch (sendError)
										{
											logger.error("Error sending OPTION_SET command via message manager", sendError, {
												operation: "sendOptionSet",
												username,
												component: "wssCloudServerManager"
											});
										}
										return;
									}
									else
									{
										throw new Error("Missing UUID in metadata");
									}
								}

								// Store metadata in ekosClient
								ekosClient.metadata = metadata;

								// Broadcast to all users with access to this observatory
								const observatoryUsers = this.getObservatoryUsers(primaryID);
								for (const observatoryUser of observatoryUsers)
								{
									try
									{
										this.wssMessageManager.sendMessageByUsername(
											observatoryUser,
											{
												type: commands.NEW_CLOUD_IMAGE,
												payload: metadata.uuid,
											},
										);
									}
									catch (error)
									{
										logger.error("Failed to send cloud image notification to user", error, {
											operation: "sendCloudImageNotification",
											username,
											observatoryUser,
											component: "wssCloudServerManager"
										});
									}
								}
							}
							catch (error)
							{
								logger.error("Failed to parse metadata", error, {
									operation: "parseMetadata",
									username,
									metadata: JSON.stringify(metadata || "undefined"),
									component: "wssCloudServerManager"
								});
								return;
							}

							// Upload to cloud
							try
							{
								const imageData = message.slice(METADATA_PACKET);

								// Get the current controller of the observatory
								const currentController =
									await this.getCurrentController(primaryID);

								// Determine which username to use for storage
								const storageUsername =
									currentController && currentController !== username
										? currentController
										: username;

								const user = await UserModel.findOne({
									username: storageUsername,
								});
								if (!user)
								{
									throw new Error(`User not found: ${storageUsername}`);
								}

								const objectName =
									"users/" +
									user._id +
									"/astronomy-images/raw/" +
									metadata["uuid"];
								logger.info(
									`${username}: Initiating upload for ${metadata["filename"]} (${imageData.length} bytes)`,
								);
								logger.info(
									`Using storage username: ${storageUsername} (Controller: ${currentController || "none"})`,
								);

								// Upload to S3/Minio
								minioClient.putObject(
									s3Instance,
									objectName,
									imageData, // This is RAW image data (e.g. FITS)
									imageData.length,
									{ "Content-Disposition": metadata["Content-Disposition"] },
									async (
										err,
										etag, // Made callback async
									) =>
									{
										if (err)
										{
											logger.error("Failed to upload RAW image file", err, {
												operation: "uploadRawImage",
												username,
												filename: metadata["filename"],
												component: "wssCloudServerManager"
											});
											return;
										}

										try
										{
											logger.info(
												`${username}: Successfully uploaded RAW file ${metadata["filename"]} (etag: ${JSON.stringify(etag)}) to ${objectName}`,
											);

											const rawFileMetadata = { ...metadata }; // Clone original metadata
											rawFileMetadata.objectname = objectName;
											rawFileMetadata.etag = etag;
											rawFileMetadata.tags = [];
											rawFileMetadata.captured_by = storageUsername;
											rawFileMetadata.observatory_owner = ekosClient.username;
											rawFileMetadata.ts = new Date(
												rawFileMetadata["date-obs"],
											);

											cloudController.savePropertyInArray(
												storageUsername,
												"metadatas",
												rawFileMetadata,
											);

											cloudController.increaseProperty(
												storageUsername,
												"storage",
												message.length,
											);

											// --- Start: Deferred Preview and Thumbnail Processing (V4.4) ---
											const ekosLiveBasePath =
												require("os").homedir() + "/.local/share/ekoslive";

											// A. Fetch Local Preview JPG (Synchronous)
											const localPreviewPath = path.resolve(
												ekosLiveBasePath,
												ekosClient.username,
												"previews",
												rawFileMetadata.uuid,
											);
											let previewContent = null;
											try
											{
												if (fs.existsSync(localPreviewPath))
												{
													previewContent = fs.readFileSync(localPreviewPath);
												}
												else
												{
													logger.warn(
														`${storageUsername}: Local preview file not found for ${rawFileMetadata.uuid} at ${localPreviewPath}.`,
													);
												}
											}
											catch (readPreviewErr)
											{
												logger.error(
													`${storageUsername}: Error reading local preview ${rawFileMetadata.uuid}: ${readPreviewErr.message}`,
												);
											}

											// B. Upload Preview to S3 (if content was fetched)
											if (previewContent)
											{
												try
												{
													await this.sendPreview(
														storageUsername,
														previewContent,
														rawFileMetadata.uuid,
														primaryID,
													);
													logger.info(
														`${storageUsername}: Cloud upload initiated for preview ${rawFileMetadata.uuid}.`,
													);
												}
												catch (previewUploadErr)
												{
													logger.error(
														`${storageUsername}: Failed to upload preview ${rawFileMetadata.uuid} to cloud: ${previewUploadErr.message}`,
													);
												}

												// C. Generate Thumbnail from previewContent (JPG) & Upload to S3 (NO Local Save)
												try
												{
													logger.debug(
														`${storageUsername}: Generating thumbnail for ${rawFileMetadata.uuid} from preview JPG.`,
													);
													sharp(previewContent) // Use the preview JPG buffer
														.resize(300)
														.toBuffer(
															async (
																sharpErr,
																thumbnailBuffer,
																thumbnailInfo,
															) =>
															{
																if (sharpErr)
																{
																	logger.error(
																		`${storageUsername}: Failed to generate thumbnail for ${rawFileMetadata.uuid} from preview: ${sharpErr.message}`,
																	);
																	return;
																}
																logger.info(
																	`${storageUsername}: Thumbnail generated for ${rawFileMetadata.uuid} from preview.`,
																);
																try
																{
																	await this.sendThumbnail(
																		storageUsername,
																		thumbnailBuffer,
																		rawFileMetadata.uuid,
																		thumbnailInfo,
																		primaryID,
																	);
																	logger.info(
																		`${storageUsername}: Cloud upload initiated for thumbnail ${rawFileMetadata.uuid}.`,
																	);
																}
																catch (thumbUploadErr)
																{
																	logger.error(
																		`${storageUsername}: Failed to upload thumbnail ${rawFileMetadata.uuid} to cloud: ${thumbUploadErr.message}`,
																	);
																}
																// NO local saving of thumbnail
																// NO triggering of thumbnail cleanup
															},
														);
												}
												catch (thumbErrOuter)
												{
													logger.error(
														`${storageUsername}: Outer error creating thumbnail for ${rawFileMetadata.uuid} from preview: ${thumbErrOuter.message}`,
													);
												}
											}
											// --- End: Deferred Preview and Thumbnail Processing ---
										}
										catch (processError)
										{
											logger.error(
												`${username}: Error processing metadata or deferred uploads for ${metadata["filename"]}: ${processError}`,
											);
										}
									},
								);
							}
							catch (uploadError)
							{
								logger.error(
									`${username}: Error preparing upload: ${uploadError.message}`,
								);
							}
						}
						catch (error)
						{
							logger.error(
								`${username}: Unhandled error in cloud processing: ${error.message}`,
							);
						}
					}
					////////////////////////////////// Web Client Messages ////////////////////////////////
					else
					{
						const userClient = this.getUserClient(username);
						if (!userClient) return;

						const machineID = userClient.machineID;
						const ekosClient = this.ekosClients.get(machineID);

						if (
							ekosClient &&
							ekosClient.connected &&
							ekosClient.ws?.readyState === WebSocket.OPEN // Add null check for ws
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
											ekosClient.ws.send(message);
										}
										catch (sendError)
										{
											logger.error(
												`${username}: Error forwarding message from web client to Ekos (${machineID}): ${sendError.message}`,
											);
											// Optionally notify the web client
											try
											{
												ws.send(
													JSON.stringify({
														type: commands.NEW_NOTIFICATION,
														payload: {
															severity: 3,
															message: `Failed to forward command to observatory: ${sendError.message}`,
															uuid: "forward_command_error",
														},
													}),
												);
											}
											catch (notifyError)
											{
												logger.error(
													`${username}: Error notifying web client about forwarding failure: ${notifyError.message}`,
												);
											}
										}
									}
									else
									{
										// Send permission denied notification
										try
										{
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
										}
										catch (notifyError)
										{
											logger.error(
												`${username}: Error sending permission denied notification to web client: ${notifyError.message}`,
											);
										}
									}
								})
								.catch((permissionError) =>
								{
									logger.error(
										`${username}: Error checking control permission for web client message: ${permissionError.message}`,
									);
									// Optionally notify the web client
									try
									{
										ws.send(
											JSON.stringify({
												type: commands.NEW_NOTIFICATION,
												payload: {
													severity: 3,
													message: "Error checking control permission",
													uuid: "permission_check_error",
												},
											}),
										);
									}
									catch (notifyError)
									{
										logger.error(
											`${username}: Error notifying web client about permission check failure: ${notifyError.message}`,
										);
									}
								});
						}
						else
						{
							logger.warn(
								`${username}: Web client message received, but no connected Ekos client found for machineID ${machineID}`,
							);
							// Optionally notify the web client
							try
							{
								ws.send(
									JSON.stringify({
										type: commands.NEW_NOTIFICATION,
										payload: {
											severity: 2,
											message:
												"Associated Ekos instance is not currently connected.",
											uuid: "ekos_disconnected_web",
										},
									}),
								);
							}
							catch (notifyError)
							{
								logger.error(
									`${username}: Error notifying web client about disconnected Ekos: ${notifyError.message}`,
								);
							}
						}
					}
				}
				catch (msgError)
				{
					// End of try block for message handler
					logger.error(
						`${username}: Error processing message: ${msgError.message}`,
						msgError,
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

			////////////////////////////////// Close Event ////////////////////////////////
			ws.on("close", () =>
			{
				try
				{
					// Wrap close handler logic
					////////////////////////////////// Ekos Client Closing ////////////////////////////////
					if (location.pathname === "/cloud/ekos")
					{
						const ekosClient = this.ekosClients.get(primaryID);
						if (ekosClient)
						{
							logger.info(
								`${username}: Ekos Cloud client disconnected from websocket server.`,
							);
							// Mark as disconnected instead of deleting
							ekosClient.connected = false;
							ekosClient.ws = null;
							// Keep the client entry in the map: this.ekosClients.delete(ekosClient.machineID);
						}
					}
					////////////////////////////////// Web Client Closing ////////////////////////////////
					else
					{
						const userClient = this.getUserClient(username);
						if (userClient)
						{
							logger.info(
								`${username}: Web Cloud client disconnected from websocket server.`,
							);
							this.userClients.delete(userClient);
						}
					}
				}
				catch (closeError)
				{
					// End of try block for close handler
					logger.error(
						`${username}: Error during WebSocket close handling: ${closeError.message}`,
						closeError,
					);
				}
			});
		});
	}

	/**
	 * @description Uploads a preview file to AWS bucket and updates the user's "previews" property in clouds collection.
	 * @param {string} username - The username.
	 * @param {Buffer|string|ReadableStream} data - The preview data to be uploaded. This can be a Buffer, a string, or a ReadableStream.
	 * @param {string} uuid - A uuid for the preview file.
	 * @throws {Error} - Re-throws any errors encountered during upload or cloud controller interaction.
	 * @example
	 * sendPreview("johndoe", new Buffer("This is a preview image"), "12345")
	 * .then(() => console.log("Preview uploaded successfully"))
	 * .catch(err => console.error("Error uploading preview:", err));
	 */
	async sendPreview(username, data, uuid, machineID)
	{
		// const ekosClient = this.getEkosClient(username);
		const ekosClient = this.ekosClients.get(machineID);
		if (isEmpty(ekosClient)) return; // Return early if no client

		try
		{
			// Wrap async logic
			const user = await UserModel.findOne({ username });
			if (!user)
			{
				// Check if user exists
				logger.error("User not found for sendPreview", new Error("User not found"), {
					operation: "sendPreview",
					username,
					component: "wssCloudServerManager"
				});
				return;
			}

			// Get the current controller of the observatory (async function)
			const currentController = await this.getCurrentController(
				ekosClient.machineID,
			);
			logger.debug(
				`sendPreview: Current controller for ${ekosClient.machineID} is ${currentController || "none"}`,
			);

			// Determine which username to use for storage
			// If there's a current controller and it's not the owner, use the controller's username (renter)
			// Otherwise use the owner's username
			// const storageUsername = (currentController && currentController !== username) ?
			// 	currentController : username;

			const objectName =
				"users/" + user._id + "/astronomy-images/previews/" + uuid;

			logger.info(
				`Preview upload - Using storage username: ${username} (Controller: ${currentController || "none"})`,
			);

			minioClient.putObject(
				s3Instance,
				objectName,
				data,
				data.length,
				(err, etag) =>
				{
					if (err)
						logger.error(
							`${username}: Error uploading preview UUID ${uuid}: ${err}`,
						);
					else
					{
						logger.info(
							`${username}: Successfully uploaded PREVIEW file ${uuid} etag: ${JSON.stringify(etag)}`,
						);
						let metadata = {};
						metadata.objectname = objectName;
						metadata.etag = etag;
						metadata.uuid = uuid;
						metadata.captured_by = username; // Should this be storageUsername? Revisit logic if needed
						metadata.observatory_owner = ekosClient.username; // Owner is the ekosClient username

						cloudController.savePropertyInArray(username, "previews", metadata); // Save under the user who initiated
					}
				},
			);
		}
		catch (error)
		{
			logger.error(
				`${username}: Error in sendPreview for UUID ${uuid}: ${error.message}`,
				error,
			);
		}
	}

	/**
	 * @description Uploads a thumbnail file to AWS bucket and updates the user's "thumbnails" property in clouds collection.
	 * @param {string} username - The username.
	 * @param {Buffer|string|ReadableStream} data - The thumbnail data to be uploaded. This can be a Buffer, a string, or a ReadableStream.
	 * @param {string} uuid - A uuid for the thumbnail file.
	 * @param {{width: number, height: number}} info - An object containing the width and height of the thumbnail.
	 * @throws {Error} - Re-throws any errors encountered during upload or cloud controller interaction.
	 * @example
	 * sendThumbnail("johndoe", new Buffer("This is a thumbnail image"), "67890", { width: 200, height: 150 })
	 * .then(() => console.log("Thumbnail uploaded successfully"))
	 * .catch(err => console.error("Error uploading thumbnail:", err));
	 */
	async sendThumbnail(username, data, uuid, info, machineID)
	{
		// const ekosClient = this.getEkosClient(username);
		const ekosClient = this.ekosClients.get(machineID);
		if (isEmpty(ekosClient)) return; // Return early if no client

		try
		{
			// Wrap async logic
			const user = await UserModel.findOne({ username });
			if (!user)
			{
				// Check if user exists
				logger.error("User not found for sendThumbnail", new Error("User not found"), {
					operation: "sendThumbnail",
					username,
					component: "wssCloudServerManager"
				});
				return;
			}

			// Get the current controller of the observatory (async function)
			const currentController = await this.getCurrentController(
				ekosClient.machineID,
			);
			logger.debug(
				`sendThumbnail: Current controller for ${ekosClient.machineID} is ${currentController || "none"}`,
			);

			// Determine which username to use for storage
			// If there's a current controller and it's not the owner, use the controller's username (renter)
			// Otherwise use the owner's username
			// const storageUsername = (currentController && currentController !== username) ?
			// 	currentController : username;

			const objectName =
				"users/" + user._id + "/astronomy-images/thumbnails/" + uuid;

			logger.info(
				`Thumbnail upload - Using storage username: ${username} (Controller: ${currentController || "none"})`,
			);

			minioClient.putObject(
				s3Instance,
				objectName,
				data,
				data.length,
				(err, etag) =>
				{
					if (err)
						logger.error(
							`${username}: Error uploading thumbnail UUID ${uuid}: ${err}`,
						);
					else
					{
						logger.info(
							`${username}: Successfully uploaded THUMB file ${uuid}`,
						);
						let metadata = {};
						metadata.objectname = objectName;
						metadata.etag = etag;
						metadata.uuid = uuid;
						metadata.width = info.width;
						metadata.height = info.height;
						metadata.captured_by = username; // Should this be storageUsername? Revisit logic if needed
						metadata.observatory_owner = ekosClient.username; // Owner is the ekosClient username

						cloudController.savePropertyInArray(
							username,
							"thumbnails",
							metadata,
						); // Save under the user who initiated
					}
				},
			);
		}
		catch (error)
		{
			logger.error(
				`${username}: Error in sendThumbnail for UUID ${uuid}: ${error.message}`,
				error,
			);
		}
	}

	setCloudEnabled(username, enabled)
	{
		const ekosClient = this.getEkosClient(username); // This might need adjustment if using machineID primarily
		if (ekosClient) ekosClient.cloudEnabled = enabled;
	}

	getObjectURL(objectname)
	{
		// Add error handling for presigned URL generation
		try
		{
			return minioClient.presignedGetObject(s3Instance, objectname);
		}
		catch (error)
		{
			logger.error(
				`Failed to generate presigned URL for object ${objectname}: ${error.message}`,
			);
			// Return a rejected promise or throw the error, depending on desired behavior
			return Promise.reject(error);
		}
	}

	removeObjects(objects, callback)
	{
		// The callback nature of minioClient.removeObjects handles errors,
		// but ensure the callback itself handles potential errors passed to it.
		return minioClient.removeObjects(s3Instance, objects, callback);
	}

	updateEkosClientCloudSetting(username, cloudEnabled, planId)
	{
		// planId is passed but not strictly needed here for enabling/disabling
		// Iterate over all ekosClients (Map)
		for (const [primaryID, ekosClient] of this.ekosClients)
		{
			if (ekosClient.username === username)
			{
				// Found the client for the user
				// All plans can enable cloud storage. The difference is quota.
				const newCloudEnabledState = cloudEnabled;

				if (ekosClient.cloudEnabled !== newCloudEnabledState)
				{
					ekosClient.cloudEnabled = newCloudEnabledState;
					logger.info(
						`CloudServer: Updated in-memory cloudEnabled for ${username} (PrimaryID: ${primaryID}) to ${ekosClient.cloudEnabled}`,
					);

					// Also inform the actual Ekos (KStars) client if it's connected
					// This is important so KStars knows whether to send RAW files to this cloud server
					if (
						ekosClient.connected &&
						ekosClient.ws &&
						ekosClient.ws.readyState === WebSocket.OPEN
					)
					{
						try
						{
							ekosClient.ws.send(
								JSON.stringify({
									type: commands.SET_CLOUD_ENABLED_STATUS, // Assuming a command to inform KStars
									payload: { cloudEnabled: ekosClient.cloudEnabled },
								}),
							);
							logger.info(
								`CloudServer: Sent SET_CLOUD_ENABLED_STATUS to KStars for ${username}`,
							);
						}
						catch (e)
						{
							logger.error("Error sending SET_CLOUD_ENABLED_STATUS to KStars on reconnect", e, {
								operation: "sendCloudStatus",
								username,
								component: "wssCloudServerManager"
							});
						}
					}
				}
				// Update all matching ekosClients for the username
			}
		}
	}
}

module.exports = wssCloudServerManager;
