# Ekos Live Project

## Online
Deployed at https://ekoslive.com.

Needs EKOS_ONLINE_CONFIG to be defied in /etc/environment on the live server.

<div align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="public/logo.png" alt="Logo" width="400" height="400">
  </a>

  <h3 align="center">EkosLive web app</h3>

  <p align="center">
    <a href="https://docs.google.com/document/d/1Svzlsxra2dslT5SZi18oDYONPJKPIrTVOHDgGTEDAQg/edit?usp=sharing"><strong>Explore the API docs »</strong></a>
    <br />
    <br />
    <a href="https://ekoslive.com">Visit Site</a>
    ·
    <a href="https://wiki.ikarustech.com/index.php/EkosLive">See wiki documentation</a>
  </p>
</div>


<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#aliases">Aliases</a></li>
      </ul>
    </li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#server">Server</a></li>
    <li><a href="#extensions">VsCode Extensions</a></li>
  </ol>
</details>


## About The Project

<b>Master</b> branch is a source for <a href="https://staging.ekoslive.com/"><b>staging</b></a>
<b>Online</b> branch is a source for <a href="https://ekoslive.com/"><b>production</b></a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>


### Built With

This section should list any major frameworks/libraries used to bootstrap your project. Leave any add-ons/plugins for the acknowledgements section. Here are a few examples.

* [![React][React.js]][React-url]
* [![Express][Express.js]][Express-url]
* [![Webpack][Webpack.js]][Webpack-url]
* [![Material][MaterialUI]][MaterialUI-url]
* [![Sentry][Sentry]][Sentry-url]
* [![MongoDB][MongoDB]][MongoDB-url]
* [![OpenAI][ChatGPT]][ChatGPT-url]
* [![Redux][Redux]][Redux-url]
* [![PayPal][PayPal]][PayPal-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>


## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.
<ul>
    <li>
    <a href="https://lucid.app/lucidspark/2e4885b7-fc16-4999-a50c-23d665b79010/edit?page=0_0#">Commucation digram between EkosLive - StellarMate App - KStars</a>
    </li>
    <li>
    <a href="https://lucid.app/lucidspark/ebe5f923-856e-4d73-822e-b40fc2f65233/edit?page=0_0#">EkosLive ACL diagram</a>
    </li>
    <li>
    <a href="https://wiki.ikarustech.com/index.php/EkosLive">Wiki</a>
    </li>
</ul>

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.
* Node
* KStars
* Mongo

### Installation

1. Clone the repo
   ```sh
   git clone git@github.com:ikarustechnologies/ekoslive.git
   ```
2. Init the submodules
  ```sh
  git submodule init
  git submodule update
  ```
3. Install NPM packages
   ```sh
   npm install
   ```
4. Build front-end part
   ```sh
   npm run webpack_dev
   ```
   or
   ```sh
   npm run webpack_prod
   ```

   <p style="color: red;">Build the landing page and ekoslive client application either in development or production mode. In development mode, redux store and sources are available while in production mode the code is uglified</p>

5. Start the server
   ```sh
   npm start
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## .env file

Make sure to add `EKOSLIVE_URL` in .env file so SharedCode can deduct the URL for Sync API calls
<!-- EKOSLIVE_URL: "http://192.168.8.103:5000" -->
<!-- EKOSLIVE_URL: "https://ekoslive.com" -->
## Aliases

Available aliases:
<ul>
<li><b>@common</b> - root/StellarMateShared</li>
<li><b>@redux</b> - root/StellarMateShared/shared/redux</li>
<li><b>@images</b> - root/StellarMateShared/images</li>
<li><b>@indi</b> - root/StellarMateShared/shared/indi</li>
<li><b>@commands</b> - root/StellarMateShared/shared/commands</li>
<li><b>@hooks</b> - root/src/client/hooks</li>
<li><b>@services</b> - root/src/client/services</li>
<li><b>@utils</b> - root/src/client/utils</li>
<li><b>@client</b> - root/src/client</li>
<li><b>@components</b> - root/src/client/Components</li>
</ul>

## Logs and Metrics

In order to check the EkosLive logs and metrics, open the <a href="https://grafana.ikarustech.com/dashboards">Grafana dashboards</a>.

### Logs

* Open the Dashboards tab.
* Go to the Logs Directory.
* Choose if you want to see all logs or user logs from panels.
* Choose the service_name as ekoslive.
* Choose the userId in case you are looking for user logs.

### Metrics

* Open the Dashboards tab.
* Choose the EkosLive panel

## Logging

The EkosLive server utilizes the `winston` library for robust and structured logging. Logs are generated in a JSON format and written to files, which are then collected and visualized in Grafana for monitoring and analysis.

### Log File Locations and Rotation

Log files are stored in the `logs/` directory at the root of the project. The logger is configured to rotate log files daily and retain them for a specific period:

*   `logs/error-%DATE%.log`: Contains logs with severity level `error`. Rotated daily, retained for <b>14 days</b>, and zipped.
*   `logs/access-%DATE%.log`: Contains logs with severity levels `info`, `warn`, and `error`. Rotated daily, retained for <b>7 days</b>, and zipped.
*   `logs/debug-%DATE%.log`: Contains logs with all severity levels (`silly` to `error`). Rotated daily, retained for <b>7 days</b>, and zipped.

The `%DATE%` placeholder in the filename is replaced with the current date in `YYYY-MM-DD` format.

### JSON Log Format

Each log entry is a JSON object with the following standard fields:

*   `level`: The severity level of the log.
*   `timestamp`: The ISO 8601 timestamp when the log was recorded.
*   `message`: The primary message of the log entry.
*   `service`: Default metadata indicating the source of the log, set to `"ekoslive-server"`.
*   `stack`: (Optional) The stack trace for logs with severity level `error`. This is automatically captured when an `Error` object is passed to the logger.

Additional data can be included in the log entry by passing an object as the second argument to the logger methods. These properties will be merged into the main JSON object.

Example:

```javascript
logger.info("User logged in", { userId: user.id, ipAddress: req.ip });
```

This would generate a JSON log similar to:

```json
{
  "level": "info",
  "timestamp": "2023-10-27T10:00:00.000Z",
  "message": "User logged in",
  "service": "ekoslive-server",
  "userId": "some-user-id",
  "ipAddress": "192.168.1.100"
}
```

### Log Levels

The following log levels are used, in order of severity:

*   `error`: Critical errors that require immediate attention and affect the application's functionality. Stack traces are automatically included.
*   `warn`: Potential issues, unexpected events, or deprecated usage that do not stop the application but should be reviewed.
*   `info`: General application flow, significant events, and successful operations (e.g., server started, user authenticated, major process completed).
*   `http`: Information about incoming HTTP requests and responses.
*   `verbose`: Detailed information about the application's behavior, useful for understanding the execution flow.
*   `debug`: Fine-grained debugging information, typically used during development to pinpoint issues.
*   `silly`: Extremely verbose debugging information, often used for tracing the execution of individual functions or small code blocks.

### Logging Guidelines

*   **Choose the appropriate level:** Select the log level that best reflects the severity and nature of the event you are logging.
*   **Provide context:** Always include relevant context in the log message or as additional metadata. This makes it significantly easier to diagnose issues. Include relevant IDs (user ID, request ID, etc.) and key variables.
*   **Log errors properly:** When catching errors, log the `Error` object directly using `logger.error(message, error)`. This ensures the stack trace is captured.
*   **Avoid sensitive information:** Never log sensitive user data, credentials, or other confidential information.
*   **Be consistent:** Maintain a consistent logging style and level usage throughout the codebase.
*   **Use the logger instance:** Import and use the configured logger instance from `src/server/logger/index.js` in your server-side code.

```javascript
const logger = require('../logger');

// Example usage:
try {
  // some operation
} catch (err) {
  logger.error('An error occurred during operation X', err);
}

logger.info('User profile updated', { userId: user.id, changes: updatedFields });
logger.debug('Processing data chunk', { chunkId: id, size: data.length });
```

### Development vs. Production Logging

The logger behaves differently based on the `NODE_ENV` environment variable:

*   **Development (`NODE_ENV=development`):** Logs are output to the console in a human-readable, colorized format. The default log level for the console is `debug`, showing all logs from `debug` to `error`.
*   **Production (default):** Logs are output to the console in JSON format. This is useful if you are using a log shipper (e.g., in Docker or Kubernetes) that collects logs from standard output. The default log level for the console is `info`, showing logs from `info` to `error`. File transports are active in both environments.

## Contributing

Please fork the repo and create a pull request. EkosLive uses the Features Branching Strategy.

Before working on any task, determine if this task is a **feature** or a **hotfix**.
* Feature: Features are new changes applied against the **master** development branch.
* Hotfix: Hotfixes are urgent bug fixes applied against the **online** production branch. Any hot fix merged to **online** must also be immediately merged into **master**

1. Fork the Project
    i. Features: Create your Feature Branch off master (`git checkout -b feature-my-feature-name master`)
    ii. Hotfixes: Create your Hotfix Branch off online (`git checkout -b hotfix-fix-some-bug online`)
1. Commit your Changes (`git commit -m 'some commit'`)
1. Push to the Branch (`git push (origin|your-remote) branch-name`)
1. Open a Pull Request

Please follow rules below when writing your code:
  * All functions and objects must be in camel case
  * All functions must have JSDocs documentation
  * All checks should not throw any errors
  * All hotfixes should be merged back into **master** branch

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Server

EkosLive runs on Apache2 web server and is managed by <a href="https://pm2.keymetrics.io/">PM2</a> process manager.

You can learn more about pm2 in their <a href="https://pm2.keymetrics.io/docs/usage/quick-start/">official documentation</a>.

## Extensions

List of recommended extensions for VsCode:
<ul>
<li><a href="https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint">ESLint</a></li>
<li><a href="https://marketplace.visualstudio.com/items?itemName=crystal-spider.jsdoc-generator">JSDoc Generator</a></li>
<li><a href="https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode">Prettier</a></li>
<li><a href="https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-ssh">Remote SSH</a></li>
<ul>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Express.js]: https://img.shields.io/badge/Express%20js-000000?style=for-the-badge&logo=express&logoColor=white
[Express-url]: https://expressjs.com/
[Casl.js]: https://casl.js.org/v6/51b9cc103e05f66c.png
[Casl-url]: https://casl.js.org/v6/en/
[Webpack.js]: https://img.shields.io/badge/Webpack-8DD6F9?style=for-the-badge&logo=Webpack&logoColor=white
[Webpack-url]: https://webpack.js.org/
[MaterialUI]: https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white
[MaterialUI-url]: https://mui.com/
[Sentry]: https://img.shields.io/badge/Sentry-black?style=for-the-badge&logo=Sentry&logoColor=#362D59
[Sentry-url]: https://sentry.io/
[MongoDB]: https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[ChatGPT]: https://img.shields.io/badge/ChatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white
[ChatGPT-url]: https://openai.com/
[Redux]: https://img.shields.io/badge/Redux-593D88?style=for-the-badge&logo=redux&logoColor=white
[Redux-url]: https://redux.js.org/
[PayPal]: https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white
[PayPal-url]: https://developer.paypal.com/api/rest/
