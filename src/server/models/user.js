const mongoose = require("mongoose");

const userScheme = new mongoose.Schema({
	username: String,
	password: { type: String, bcrypt: true },
	token: String,
	email: String,
	license: String,
	serial: String,
	ip: String,
	lastLogged: { type: Date, default: Date.now },
	connected: Boolean,
	socialAccount: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Social",
	},
	observatories: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Observatory",
		},
	],
	role: {
		type: String,
		enum: [
			"REGISTERED",
			"ADMIN",
			"MODERATOR",
			"SUPER_ADMIN",
		],
	},
	promptsLeft: Number,
	promptsUpdateTS: Date,
	machine_id: { type: String, nullable: true },
	plan_id: String,
	ekosLiveCloudEnabled: { type: Boolean, default: false },
});

userScheme.pre("findOneAndUpdate", {}, async function (next)
{
	const query = this.getQuery() ?? {};
	if (query?.username)
	{
		this.setQuery({ ...query, username: query?.username?.toLowerCase() });
	}
	if (query.email)
	{
		this.setQuery({ ...query, email: query?.email?.toLowerCase() });
	}
	next();
});

userScheme.pre("findOneAndUpdate", {}, async function (next)
{
	const query = this.getQuery() ?? {};
	if (query?.username)
	{
		this.setQuery({ ...query, username: query?.username?.toLowerCase() });
	}
	if (query.email)
	{
		this.setQuery({ ...query, email: query?.email?.toLowerCase() });
	}
	next();
});

userScheme.plugin(require("mongoose-bcrypt"));

module.exports = mongoose.model("User", userScheme);
