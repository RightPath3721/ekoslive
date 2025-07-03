const express = require('express');
const multer = require('../utils/multerUpload');
const logger = require('../logger');
const authMiddleware = require('../middlewares/auth');
const CommentController = require('../controller/comment');
const PostModel = require('../models/community/post');
const CommentModel = require('../models/community/comment')
const { getObjectUrl } = require('../utils/minio');
const CommentRoutes = express.Router();

CommentRoutes.post('/', authMiddleware, async (req, res) =>
{
    const { username } = req.query;
    try
    {
        const comment = await CommentController.createComment(req.body, username);

        if(comment.posted_by.avatar) {
            comment.posted_by.avatar = await getObjectUrl(comment.posted_by.avatar);
        }
        res.json(comment);
    } catch (error)
    {
        logger.error("Error creating new comment", error, {
            username,
            operation: "createComment",
            postId: req.body.post
        });
        res.status(400).json({ message: error.message });
    }
});

CommentRoutes.patch('/:commentID', authMiddleware, async (req, res) =>
{
    const { username } = req.query;
    const { commentID } = req.params;

    try
    {
        const comment = await CommentModel.findById(commentID);
        if (!comment)
        {
            res.status(404).json({ message: "Comment not found" });
        } else if (!req.ability.can('update', comment))

        {
            res.status(403).json({ message: "Forbidden" })
        } else
        {
            const updatedComment = await CommentController.updateComment(commentID, req.body);
            res.json(updatedComment);
        }
    } catch (error)
    {
        logger.error("Error updating comment", error, {
            username,
            commentID,
            operation: "updateComment"
        });
        res.status(400).json({ message: error.message });
    }
});

CommentRoutes.delete('/:commentID', authMiddleware, async (req, res) =>
{
    const { username } = req.query;
    const { commentID } = req.params;

    try
    {
        const comment = await CommentModel.findById(commentID);
        if (!comment)
        {
            res.status(404).json({ message: "Comment not found" });
        } else if (!req.ability.can('delete', comment))
        {
            res.status(403).json({ message: "Forbidden" })
        } else
        {
            const result = await CommentController.deleteComment(commentID);
            if (result)
            {
                res.status(200).json({ message: "Comment deleted successfully" });
            } else
            {
                res.status(400).json({ message: "Failed to delete comment" });
            }
        }
    } catch (error)
    {
        logger.error("Error deleting comment", error, {
            username,
            commentID,
            operation: "deleteComment"
        });
        res.status(400).json({ message: error.message });
    }
});

CommentRoutes.get('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    try
    {
        const comment = await CommentModel.findById(id).populate("posted_by");
        return res.json(comment);
    }
    catch (error)
    {
        logger.error("Error getting comment", error, {
            commentId: id,
            operation: "getComment"
        });
        res.status(400).json({ message: error.message });
    }
});

CommentRoutes.post('/like/:commentID', authMiddleware, async (req, res) => {
    const { commentID } = req.params;
    const { likedBy } = req.body;
    try
    {
        const result = await CommentController.toggleLikeComment(commentID, likedBy);
        res.json(result);
    } catch (error)
    {
        logger.error("Error toggling comment like", error, {
            commentID,
            likedBy,
            operation: "toggleLikeComment"
        });
        res.status(400).json({ message: error.message });
    }
})


module.exports = CommentRoutes;