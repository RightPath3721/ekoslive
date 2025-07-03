const SocialModel = require("../models/social");
const UserModel = require("../models/user");
const findOwner = require("../utils/findOwner");
const { saveImgInBucket, getObjectUrl } = require("../utils/minio");

class SocialController
{
	async createSocialProfile(username, socialAccountData)
	{
		const owner = await findOwner(username);
		if (owner.socialAccount) throw new Error("User already has an account");
		const newAccountInfo = await SocialModel.create({
			...socialAccountData,
			owner: owner._id,
		});
		await UserModel.findByIdAndUpdate(owner._id, {
			socialAccount: newAccountInfo._id,
			observatories: [],
		});
		return newAccountInfo;
	}

	async updateSocialProfile(username, data)
	{
		const owner = await findOwner(username);
		const updatedAccount = await SocialModel.findOneAndUpdate(
			{ owner: owner._id },
			{ ...data },
			{ returnDocument: "after" },
		);
		return updatedAccount;
	}

	async findSocialProfileByUsername(username)
	{
		const owner = await UserModel.findOne({ username });
		if (!owner) throw new Error("User not found");
		const accountInfo = await owner.populate("socialAccount");
		return accountInfo.socialAccount;
	}

	async updateAvatar(username, file)
	{
		const owner = await findOwner(username);
		const objectName = "users/" + owner._id + "/avatar";

		await saveImgInBucket(objectName, file);

		await SocialModel.findOneAndUpdate(
			{ owner: owner._id },
			{ avatar: objectName },
		);

		return await getObjectUrl(objectName);
	}

	async updateBackgroundImage(username, file)
	{
		const owner = await findOwner(username);
		const objectName = "users/" + owner._id + "/background";

		await saveImgInBucket(objectName, file);

		await SocialModel.findOneAndUpdate(
			{ owner: owner._id },
			{ profile_background: objectName },
		);

		return await getObjectUrl(objectName);
	}

	async updateFollowers(username, followingProfileId, value = true)
	{
		const user = await this.findSocialProfileByUsername(username);
		if (!user)
			throw new Error(`User with username: ${user.username} not found`);

		const action = value ? "$push" : "$pull";

		await SocialModel.findByIdAndUpdate(followingProfileId, {
			[action]: { followers: user._id },
		});

		await SocialModel.findByIdAndUpdate(user._id, {
			[action]: { following: followingProfileId },
		});
	}

	async getSocialProfile(nickname)
	{
		const profile = await SocialModel.findOne({
			social_nickname: { 
				$in: [nickname, `@${nickname}`]
			}
		});
		return profile;
	}

	async getFollowers(profileId, page, limit, search)
	{
		const userProfile = await SocialModel.findById(profileId);
		if (!userProfile) throw new Error("User not found");
		await userProfile.populate("followers");

		const followers = (
			await Promise.allSettled(
				userProfile.followers?.map?.(async (socialProfile) => ({
					...socialProfile._doc,
					avatar: socialProfile.avatar
						? await getObjectUrl(socialProfile.avatar)
						: null,
				})) ?? [],
			)
		)
			.map((result) => (result.status === "fulfilled" ? result.value : null))
			.filter((profile) => profile);

		return {
			data: followers ?? [],
			count: followers?.length ?? 0,
		};
	}

	async getFollowing(profileId, page, limit, search)
	{
		const userProfile = await SocialModel.findById(profileId);
		if (!userProfile) throw new Error("User not found");
		await userProfile.populate("following");

		const following = (
			await Promise.allSettled(
				userProfile.following?.map?.(async (socialProfile) => ({
					...socialProfile._doc,
					avatar: socialProfile.avatar
						? await getObjectUrl(socialProfile.avatar)
						: null,
				})) ?? [],
			)
		)
			.map((result) => (result.status === "fulfilled" ? result.value : null))
			.filter((profile) => profile);

		return {
			data: following ?? [],
			count: following?.length ?? 0,
		};
	}
}

module.exports = new SocialController();
