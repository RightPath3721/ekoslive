const UserModel = require('../models/user');
const GalleryImageModel = require('../models/community/galleryImage');

class GalleryImageController
{
    async getImagesPreviews(username, limit = 5, page = 0)
    {
        const user = await this.#getUser(username);
        const images = await GalleryImageModel.find({ captured_by: user._id }, null, { sort: "creadetAt", limit: page * limit });
        return images;
    }

    async #getUser(username)
    {
        const user = await UserModel.findOne({ username });
        if (!user) throw new Error("User not found");
        return user;
    }
}

module.exports = new GalleryImageController();
