const UserModel = require("../models/user");
const SurveyModel = require("../models/survey");

class SurveyController
{
	async createSurvey(data, username)
	{
		const user = await UserModel.findOne({ username });

		if (!user) throw new Error("User not found");

		const survey = await SurveyModel.create({ ...data, user: user._id });

		return survey;
	}

	async updateSurvey(data, username)
	{
		const user = await UserModel.findOne({ username });

		if (!user) throw new Error("User not found");

		const survey = await SurveyModel.findOneAndUpdate(
			{ user: user._id },
			{ ...data },
			{ new: true },
		);

		return survey;
	}

	async getSurvey(username)
	{
		const user = await UserModel.findOne({ username });

		if (!user) throw new Error("User not found");

		const survey = await SurveyModel.findOne({ user: user._id });

		return survey;
	}

	async checkSurveyResult(username)
	{
		const survey = await this.getSurvey(username);

		return !!survey;
	}
}

module.exports = new SurveyController();
