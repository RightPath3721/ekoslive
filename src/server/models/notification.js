const mongoose = require("mongoose");
const { string } = require("zod");

const actionSchema = new mongoose.Schema({
	type: { type: String },
	id: { type: mongoose.Schema.Types.ObjectId },
});

const notificationScheme = new mongoose.Schema(
	{
		type: {
			type: mongoose.Schema.Types.Mixed,
			validate: {
				validator: function (value)
				{
					return typeof value === "string" || typeof value === "number";
				},
				message: (props) =>
					`${props.value} is not a valid type! It should be either a string or number.`,
			},
		},
		severity: {
			type: mongoose.Schema.Types.Mixed,
			default: "INFO",
			validate: {
				validator: function (value)
				{
					const allowedValues = ["INFO", "WARNING", "CRITICAL", 1, 2, 3];
					return allowedValues.includes(value);
				},
				message: (props) =>
					`${props.value} is not a valid severity! Allowed values are: "INFO", "WARNING", "CRITICAL", 1, 2, 3.`,
			},
		},
		content: String,
		target_users: {
			type: mongoose.Schema.Types.Mixed,
			validate: {
				validator: function (value)
				{
					// Check if the value is a string and equals "all"
					if (value instanceof mongoose.Types.ObjectId)
					{
						return true;
					}
					// Check if the value is an array of ObjectId
					if (
						Array.isArray(value) &&
						value.every((id) => mongoose.Types.ObjectId.isValid(id))
					)
					{
						return true;
					}
					return false;
				},
				message: (props) => `${props.value} is not a valid target_users value!`,
			},
		},
		read_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "Social" }],
		priority: [{ type: String, enum: ["HIGH", "MEDIUM", "LOW"] }],
		role: {
			type: String,
			enum: ["REGISTERED", "MODERATOR", "ADMIN"],
			default: "REGISTERED",
		},
		actions: [actionSchema],
		channel: { type: String, enum: ["EKOS", "COMMUNITY"] },
	},
	{ timestamps: true },
);

module.exports = mongoose.model("Notification", notificationScheme);
