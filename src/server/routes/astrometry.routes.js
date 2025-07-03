const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth');
const AstrometryController = require('../controller/astrometry');
const logger = require('../logger');
const upload = multer({ dest: '/tmp/uploads' });

const astrometryRoutes = express.Router();

astrometryRoutes.get('/login', authMiddleware, async (req, res) =>
{
    try
    {
        const sessiondID = await AstrometryController.login();
        res.json({ success: true, sessiondID });
    } catch (error)
    {
        res.json({ success: false, error });
    }
});

astrometryRoutes.post('/upload', authMiddleware, upload.single('file'), async (req, res) =>
{
    try
    {
        const response = await AstrometryController.uploadImage(req.file, req.query.username);
        res.json({ response });
    } catch (error)
    {
        logger.error("Error uploading file to astrometry", error, {
            username: req.query.username,
            operation: "uploadImage",
            fileName: req.file?.originalname,
            fileSize: req.file?.size
        });
        res.json({ error });
    };
});

module.exports = astrometryRoutes;
