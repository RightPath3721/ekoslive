const AchievementModel = require('../models/achievement');
const UserModel = require('../models/user');
const logger = require('../logger');

class AchievementController
{
    async getUserAchievements(username)
    {
        const user = await this.#getUser(username);
        const achievements = await AchievementModel.find({ owner: user._id });

        return achievements;
    }

    async createUserAchievement(username, data)
    {
        const user = await this.#getUser(username);
        const achievement = await AchievementModel.create({ ...data, owner: user._id });

        return achievement;
    }

    async #getUser(username)
    {
        const user = await UserModel.findOne({ username });
        if (!user) throw new Error('User not found');
        return user;
    }

    async updateUserAchievements(username, achievementsData) {
        const user = await this.#getUser(username);
    
        if (!user) {
            throw new Error('User not found');
        }
    
        const updatedAchievements = [];
    
        for (const achievement of achievementsData) {
            const { key, ...updateFields } = achievement;
    
            try {
                // Try to find and update the existing achievement
                let updatedAchievement = await AchievementModel.findOneAndUpdate(
                    { key: key, owner: user._id },
                    updateFields,
                    { new: true }
                );
    
                // If not found, create a new achievement
                if (!updatedAchievement) {
                    updatedAchievement = new AchievementModel({
                        key,
                        owner: user._id,
                        ...updateFields
                    });
                    await updatedAchievement.save();
                }
    
                updatedAchievements.push(updatedAchievement);
            } catch (error) {
                logger.error("Error processing achievement", error, { 
                    username, 
                    achievementKey: key 
                });
            }
        }

        return updatedAchievements;
    }
};

module.exports = new AchievementController();