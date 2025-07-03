const logger = require('../logger');
const UserModel = require('../models/user');

const checkAccess = (action, subject, redirectRoute) =>
{
    return async (req, res, next) =>
    {
        const { username } = req.query;

        try
        {
            if (req.ability.can(action, subject)) next();
            if (username)
            {
                const user = await UserModel.findOne({ username });
                if ((user && req.ability.can(action, subject, user)))
                {
                    next();
                } else if (req.ability.can(action, subject))
                {
                    next();
                } else res.status(403).json({ error: "Forbidden" });
            } else
            {
                next();
            }
        } catch (error)
        {
            logger.error("Access control error", error, {
                username,
                action,
                subject,
                redirectRoute,
                userAgent: req.get('User-Agent')
            });
            if (redirectRoute)
            {
                res.redirect(redirectRoute);
            } else
            {
                res.status(403).json({ error: "Forbidden" });
            }
        }
    };
};

module.exports = checkAccess;