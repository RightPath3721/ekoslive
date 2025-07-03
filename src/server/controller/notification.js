const PostModel = require('../models/community/post');
const CommentModel = require('../models/community/comment')
const GalleryImageModel = require('../models/community/galleryImage');
const MetadataModel = require('../models/community/metadata');
const EquipmentProfileModel = require('../models/observatory/equipmentProfile');
const NotificationModel = require("../models/notification");
const UserModel = require('../models/user');
const { saveImgInBucket } = require('../utils/minio');

class NotificationController
{
    async #getUser(username)
	{
		const user = await UserModel.findOne({ username }).populate("socialAccount");
		if (!user) throw new Error("User not found");
		return user;
	}

    async getNotifications(username)
    {
        const user = await this.#getUser(username);
        const notifications = await NotificationModel.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    isTargetUsersArray: { $isArray: "$target_users" }
                }
            },
            {
                $match: {
                    $or: [
                        { $and: [ { isTargetUsersArray: true }, { target_users: { $in: [user.socialAccount._id] } } ] },
                        { $and: [ { isTargetUsersArray: false }, { target_users: { $ne: user.socialAccount._id } } ] }
                    ]
                }
            },
            {
                $match: {
                    role: {
                        $in: (() => {
                            switch (user.role) {
                                case 'REGISTERED':
                                case 'SUBSCRIBER':
                                    return ['REGISTERED'];
                                case 'MODERATOR':
                                    return ['REGISTERED', 'MODERATOR'];
                                case 'ADMIN':
                                    return ['REGISTERED', 'MODERATOR', 'ADMIN'];
                                default:
                                    return [];
                            }
                        })()
                    }
                }
            }
        ]);

        return notifications; 
    }

    async getUnreadNotifications(username)
    {
        const user = await this.#getUser(username);
        const unreadNotifications = await NotificationModel.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $addFields: {
                    isTargetUsersArray: { $isArray: "$target_users" }
                }
            },
            {
                $match: {
                    $or: [
                        { $and: [ { isTargetUsersArray: true }, { target_users: { $in: [user.socialAccount._id] } } ] },
                        { $and: [ { isTargetUsersArray: false }, { target_users: { $ne: user.socialAccount._id } } ] }
                    ]
                }
            },
            {
                $match: {
                    role: {
                        $in: (() => {
                            switch (user.role) {
                                case 'REGISTERED':
                                case 'SUBSCRIBER':
                                    return ['REGISTERED'];
                                case 'MODERATOR':
                                    return ['REGISTERED', 'MODERATOR'];
                                case 'ADMIN':
                                    return ['REGISTERED', 'MODERATOR', 'ADMIN'];
                                default:
                                    return [];
                            }
                        })()
                    }
                }
            },
            {
                $match: {
                    read_users: { $nin: [user.socialAccount._id] }
                }
            }
        ]);


        return unreadNotifications; 
    }

    async readNotification(username, id) 
    {
        const user = await this.#getUser(username);
        const notification = await NotificationModel.findById(id);
        notification.read_users.push(user.socialAccount._id);
        await notification.save()
    }
}

module.exports = new NotificationController();
