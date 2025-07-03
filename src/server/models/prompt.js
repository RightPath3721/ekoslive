const mongoose = require("mongoose");

module.exports = mongoose.model(
	"Prompt",
	new mongoose.Schema(
		{
			username: String,
			prompt: { type: String, reqiured: true },
			response: { type: String, required: true },
			feedback: Object,
			type: String,
			scheduler: String,
			sequence: String,
			summary: String,
			ekosRunning: Boolean,
			source: { type: String, enum: ["WEB", "APP"], default: "APP" },
			executed: Boolean
		},
		{
			timestamps: true,
			collection: "prompts",
		},
	),
);
