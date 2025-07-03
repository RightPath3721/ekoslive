const express = require("express");
const wstokenVerifier = require("../auth/ws-token-verifier");
const _ = require("lodash");
const logger = require("../logger");
const axios = require("axios");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const { secret } = require("../config");
const softwareRoutes = express.Router();
const driverController = require("../controller/driver");
const process = require("process");

// Auth error handling
let throwFailed = function (res, message)
{
	return res.json({ success: false, message: message });
};

const promiseSerial = (funcs) =>
	funcs.reduce(
		(promise, func) =>
			promise.then((result) =>
				func().then(Array.prototype.concat.bind(result)),
			),
		Promise.resolve([]),
	);

// Downloads file from online server
let updateSoftware = function (token, onePackage)
{
	// Unless package is for ALL architecture
	// Make sure the package corresponds to the arch of the machine
	if (onePackage.arch !== "all")
	{
		if (onePackage.arch !== process.arch) return;
	}
	axios
		.get(
			"https://live.stellarmate.com/api/software/download?token=" +
				token +
				"&filename=" +
				onePackage.filename,
			{
				responseType: "stream",
			},
		)
		.then((response) =>
		{
			const filename = "/tmp/" + onePackage.filename;
			let stream = response.data.pipe(fs.createWriteStream(filename));
			stream.on("finish", () =>
			{
				logger.info("Installing " + filename);
				exec(
					"/etc/stellarmate/deploy_package.sh " + filename,
					(err, stdout, stderr) =>
					{
						if (err)
						{
							logger.error("Failed to deploy package", err, {
								operation: "deployPackage",
								filename,
								packageName: onePackage.filename
							});
							return;
						}

						if (stdout) logger.debug(stdout);
						else if (stderr) logger.warn(stderr);
					},
				);
			});
		});
};

// Run single bash command and updates build file
let executeBuilds = function (oneBuild)
{
	logger.info(
		"About to execute build " +
			oneBuild.build +
			" with command: " +
			oneBuild.bash,
	);

	return new Promise(function (resolve, reject)
	{
		exec(oneBuild.bash, (err) =>
		{
			if (err)
			{
				logger.error("Build execution error", err, {
					operation: "executeBuild",
					buildName: oneBuild.build,
					bashCommand: oneBuild.bash
				});
				reject(err);
			}
			else
			{
				logger.info("Build command executed successfully.");
				fs.writeFile("/etc/stellarmate/build", oneBuild.build + "\n", (err) =>
				{
					if (err) reject(err);
					else resolve(oneBuild.build);
				});
			}
		});
	});
};

// Gets current EkosLive version
softwareRoutes.get("/version", function (req, res)
{
	return res.send(process.env.version);
});

// Get current StellarMate OS Build
softwareRoutes.get("/build", function (req, res)
{
	try
	{
		const build = fs.readFileSync("/etc/stellarmate/build", "utf8");
		return res.json({ build: build });
	}
	catch
	{
		// If no build is yet available, return an old dummy build to get started
		return res.json({ build: "20190601" });
	}
});

// Get list of software versions available for download
softwareRoutes.get("/versions", function (req, res)
{
	const versions = spawn("/etc/stellarmate/versions.sh");

	versions.stdout.on("data", (data) =>
	{
		data = JSON.parse(data);
		data.push({
			name: "ekoslive",
			version: process.env.version,
			arch: process.arch,
		});
		logger.info("Versions: " + JSON.stringify(data));
		return res.json({ success: true, versions: data });
	});

	versions.stderr.on("data", (data) =>
	{
		return throwFailed(res, data);
	});
});

// It takes a list of software {name, version} pairs and checks against
// the latest software available on the server. If there is a new version
// of a particular package, then it downloads it and install it and restart
// the service file associated with it.
softwareRoutes.post("/update_software", function (req, res)
{
	// This token MUST be the remoteToken return earliar by the authentication API call
	// in the offline server. remoteToken means online connectivity is available and we can
	// check for software updates.
	const token = req.body.token;
	const versions = req.body.versions;

	axios
		.post("https://live.stellarmate.com/api/software/software_diff", {
			//axios.post('http://localhost:3000/api/software/software_diff', {
			token,
			versions,
		})
		.then(function (response)
		{
			if (response.data.length === 0)
				return res.json({ update: "No update available." });

			for (const onePackage of response.data) updateSoftware(token, onePackage);

			return res.json({ update: "Update in progress..." });
		})
		.catch(function (error)
		{
			console.log(error);
			return throwFailed(res, "Checking software updates failed! " + error);
		});
});

// Return an array containing which packages are considered new by
// looking at the supplied list of submitted software names and versions
softwareRoutes.post("/software_diff", function (req, res)
{
	const token = req.body.token;
	const server_versions = req.body.versions;

	if (wstokenVerifier(token, secret) === false)
	{
		return throwFailed(res, "Invalid token.");
	}

	let updates = [];

	const filename = __dirname + "/../../../software/versions.json";

	try
	{
		let latest_versions = JSON.parse(fs.readFileSync(filename));
		for (const latestPackage of latest_versions)
		{
			// const serverPackage = server_versions.find(app => app.name === latestPackage.name);
			// if (serverPackage && latestPackage.version > serverPackage.version)
			//     updates.push(latestPackage);

			const serverPackages = server_versions.filter(
				(app) => app.name === latestPackage.name,
			);
			for (const oneServerPackage of serverPackages)
			{
				// Check to see if we have a new version on ekoslive server
				if (latestPackage.version > oneServerPackage.version)
				{
					// If the package is for a specific package, then let us make sure
					// that we return the correct package info
					if (_.has(oneServerPackage, "arch") && _.has(latestPackage, "arch"))
					{
						if (oneServerPackage.arch === latestPackage.arch)
						{
							updates.push(latestPackage);
							break;
						}
					}
					else
					{
						updates.push(latestPackage);
						break;
					}
				}
			}
		}

		return res.json(updates);
	}
	catch (err)
	{
		return throwFailed(res, "filename: " + filename + " " + err);
	}
});

// Check if there are any build updates which are usually associated with
// running bash commands necessary for system changes remotely
softwareRoutes.post("/update_builds", function (req, res)
{
	// This token MUST be the remoteToken return earliar by the authentication API call
	// in the offline server. remoteToken means online connectivity is available and we can
	// check for software updates.
	const token = req.body.token;
	const build = req.body.build;

	axios
		.post("https://live.stellarmate.com/api/software/builds_diff", {
			//axios.post('http://localhost:3000/api/software/builds_diff', {
			token,
			build,
		})
		.then(function (response)
		{
			if (response.data.length === 0)
				return res.json({ builds: "No update available." });

			const funcs = response.data.map(
				(oneBuild) => () => executeBuilds(oneBuild),
			);

			promiseSerial(funcs)
				.then(() =>
				{
					return res.json({ builds: "builds update is complete." });
				})
				.catch((error) =>
				{
					return throwFailed(res, "Error executing builds " + error);
				});
		})
		.catch(function (error)
		{
			console.log(error);
			return throwFailed(res, "Checking build updates failed! " + error);
		});
});

// Given a specific build, returns all the builds the needs to be applied
// after this build date
softwareRoutes.post("/builds_diff", function (req, res)
{
	const token = req.body.token;
	const build = req.body.build;

	if (wstokenVerifier(token, secret) === false)
	{
		return throwFailed(res, "Invalid token.");
	}

	let updates = [];

	const filename = __dirname + "/../../../software/builds.json";

	try
	{
		let allBuilds = JSON.parse(fs.readFileSync(filename));
		for (const oneBuild of allBuilds)
		{
			if (oneBuild.build > build) updates.push(oneBuild);
		}

		return res.json(updates);
	}
	catch (err)
	{
		return throwFailed(res, "filename: " + filename + " " + err);
	}
});

softwareRoutes.post("/driver", function (req, res)
{
	const driver = req.body;

	driverController
		.add(driver)
		.then((message) =>
		{
			return res.json({ message });
		})
		.catch((err) =>
		{
			return throwFailed(res, err);
		});
});

// Return an online software package
softwareRoutes.get("/download", function (req, res)
{
	const token = req.query.token;
	const filename = req.query.filename;

	if (wstokenVerifier(token, secret) === false)
	{
		return throwFailed(res, "Invalid token.");
	}

	const file = `${__dirname} + '/../../../software/` + filename;
	res.download(file);
});

module.exports = softwareRoutes;
