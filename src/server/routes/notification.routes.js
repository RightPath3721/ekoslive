const express = require('express');
const multer = require('../utils/multerUpload');
const logger = require('../logger');
const authMiddleware = require('../middlewares/auth');
const CommentController = require('../controller/comment');
const PostModel = require('../models/community/post');
const CommentModel = require('../models/community/comment')
const NotificationModel = require('../models/notification')
const { getObjectUrl } = require('../utils/minio');
const NotificationRoutes = express.Router();
const NotificationController = require('../controller/notification')

NotificationRoutes.get('/', authMiddleware, async (req, res) =>
{
    try
    {
        const { username } = req.query;
        const notifications = await NotificationController.getNotifications(username);

        res.json(notifications);
    } catch (error)
    {
        logger.error("Error getting notifications", error, {
            username,
            operation: "getNotifications"
        });
        res.status(400).json({ message: error.message });
    }
});

NotificationRoutes.get('/unread', authMiddleware, async (req, res) =>
{
    try
    {
        const { username } = req.query;
        const unreadNotifications = await NotificationController.getUnreadNotifications(username);

        res.json(unreadNotifications);
    } catch (error)
    {
        logger.error("Error getting unread notifications", error, {
            username,
            operation: "getUnreadNotifications"
        });
        res.status(400).json({ message: error.message });
    }
});

NotificationRoutes.get('/read/:id', authMiddleware, async (req, res) =>
{
    const { id } = req.params;
    const { username } = req.query;
    try
    {
        await NotificationController.readNotification(username, id);

        res.json({message: "success"});
    } catch (error)
    {
        logger.error("Error reading notification", error, {
            username,
            operation: "readNotification",
            notificationId: id
        });
        res.status(400).json({ message: error.message });
    }
});

module.exports = NotificationRoutes;