const express = require('express');
const logger = require('../logger');
const authMiddleware = require('../middlewares/auth');
const GalleryRoutes = express.Router();
const GalleryImagesController = require('../controller/galleryImage');

GalleryRoutes.get('/', authMiddleware, async (req, res) =>
{
    const { username } = req.query;

    try
    {
        const images = await GalleryImagesController.getImagesPreviews(username);
        res.json(images);
    } catch (error)
    {
        logger.error("Error getting images from gallery", error, {
            username,
            operation: "getImagesPreviews"
        });
        res.status(400).json({ message: error.message });
    }
});

module.exports = GalleryRoutes;