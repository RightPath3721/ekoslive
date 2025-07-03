const wsTokenVerifier = require("../auth/ws-token-verifier");
const { secret } = require("../config");
const logger = require("../logger");

const throwFailed = (res, message) =>
{
    logger.warn(message);
    return res.json({ result: false, message: message });
};

const authMiddleware = async (req, res, next) =>
{
    const username = req.query.username;
    const token = req.query.token;

    if (wsTokenVerifier(token, secret) === false)
        return throwFailed(res, username + ": Invalid token " + token);

    next();
};

module.exports = authMiddleware;