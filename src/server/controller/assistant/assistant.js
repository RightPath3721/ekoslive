const { default: OpenAI } = require("openai");
const { openAIKey } = require("../../config");

const openai = new OpenAI({
	apiKey: openAIKey,
	dangerouslyAllowBrowser: true,
});

class AssistantController
{
	async createAssistant({ model, instructions, name, tools })
	{
		try
		{
			return await openai.beta.assistants.create({
				model: model,
				instructions: instructions,
				name: name,
				tools: tools,
			});
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async getAssistant({ assistantId })
	{
		try
		{
			return await openai.beta.assistants.retrieve(assistantId);
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async updateAssistant({ assistantId, model, instructions, tools })
	{
		try
		{
			return await openai.beta.assistants.update(assistantId, {
				model: model,
				instructions: instructions,
				tools: tools,
			});
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async createTread()
	{
		try
		{
			return await openai.beta.threads.create();
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async getThread({ threadId })
	{
		try
		{
			return await openai.beta.threads.retrieve(threadId);
		}
		catch (error)
		{
			console.log(error.name, error.message);

			return {
				error: true,
				message: error.message,
			};
		}
	}

	async deleteThread({ threadId })
	{
		try
		{
			return await openai.beta.threads.del(threadId);
		}
		catch (error)
		{
			console.log(error.name, error.message);
			return {
				error: true,
				message: error.message,
			};
		}
	}

	async addMessage({ threadId, message, messageId })
	{
		try
		{
			let metadata = { id: messageId };

			return await openai.beta.threads.messages.create(threadId, {
				role: "user",
				content: message,
				metadata,
			});
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async getMessages({ threadId })
	{
		try
		{
			const messages = await openai.beta.threads.messages.list(threadId);
			return messages.data;
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async startRun({ assistantId, threadId, instructions })
	{
		try
		{
			let options = {
				assistant_id: assistantId,
			};
			if (instructions)
			{
				options.instructions = instructions;
			}

			return await openai.beta.threads.runs.create(threadId, options);
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async getRun({ threadId, runId })
	{
		try
		{
			return await openai.beta.threads.runs.retrieve(threadId, runId);
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}

	async submitOutputs({ threadId, runId, tool_outputs })
	{
		try
		{
			return await openai.beta.threads.runs.submitToolOutputs(threadId, runId, {
				tool_outputs: tool_outputs,
			});
		}
		catch (error)
		{
			console.log(error.name, error.message);
			throw error;
		}
	}
}

module.exports = new AssistantController();
