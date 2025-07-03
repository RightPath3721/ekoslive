import axios from "axios";
import subscriptionService from "@services/subscriptionService";
import generatePassword from "@utils/generatePassword";

class UserService
{
	#axios;
	constructor()
	{
		this.#axios = axios.create();
	}

	async login(credentials)
	{
		try
		{
			if (!credentials.username || !credentials.password) return;
			const { data } = await this.#axios.post("/api/authenticate", credentials);
			return data;
		}
		catch (error)
		{
			return error.response.data.message;
		}
	}

	async register(credentials)
	{
		try
		{
			const { data } = await this.#axios.post("/api/register", credentials);
			return data;
		}
		catch (error)
		{
			return error.response.data;
		}
	}

	async forgotPasswordOrUsername(email)
	{
		try
		{
			const { data: result } = await this.#axios.post("/api/forget-password", {
				email,
			});
			return result;
		}
		catch (error)
		{
			return error.response.data.message;
		}
	}

	async getUserFromGoogle(hash)
	{
		const tokens = this.#getTokensFromHash(hash);

		try
		{
			const registeredUser = await this.#googleUserLogin(
				tokens.id_token,
				tokens.access_token,
			);
			if (!registeredUser || typeof registeredUser === "string")
			{
				const user = await this.#googleUserRegister(
					tokens.access_token,
					tokens.id_token,
				);
				return user;
			}
			return registeredUser;
		}
		catch (error)
		{
			return error.response?.data?.message;
		}
	}

	async #googleUserLogin(id_token, access_token)
	{
		try
		{
			const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`;
			const { data: googleData } = await axios.get(url);
			const user = await this.login({
				username: googleData.email,
				token: id_token,
				source: "google_web",
			});

			if (typeof user === "string") return null;
			return user;
		}
		catch (error)
		{
			throw new Error(error);
		}
	}

	async #googleUserRegister(accessToken)
	{
		try
		{
			const url = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`;
			const { data } = await axios.get(url);
			const userData = await this.register({
				email: data.email,
				password: generatePassword(),
				name: data.given_name,
			});
			return userData;
		}
		catch (error)
		{
			throw new Error(error);
		}
	}

	#getTokensFromHash(hash)
	{
		return hash
			.split("&")
			.filter(
				(item) =>
					item.startsWith("id_token") || item.startsWith("access_token"),
			)
			.reduce((acc, item) =>
			{
				const [key, value] = item.split("=");
				return { ...acc, [key]: value };
			}, {});
	}
}

export default new UserService();
