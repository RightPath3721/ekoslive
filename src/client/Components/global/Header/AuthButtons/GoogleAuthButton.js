import React from "react";
import GoogleIcon from "@client/icons/GoogleIcon";

const GoogleAuthButton = () =>
{
	return (
		<form
			action="https://accounts.google.com/o/oauth2/auth"
			method="GET"
			className="w-full"
		>
			<input
				type="hidden"
				name="client_id"
				value={process.env.REACT_APP_GOOGLE_CLIENT_ID}
			/>
			<input
				type="hidden"
				name="redirect_uri"
				value={process.env.REACT_APP_URL}
			/>
			<input type="hidden" name="response_type" value="id_token token" />
			<input type="hidden" name="scope" value="profile email" />
			<input type="hidden" name="prompt" value="select_account" />
			<input type="hidden" name="access_type" value="online" />
			<input type="hidden" name="state" value="pass-through value" />
			<button
				className="px-4 py-2 rounded border w-full inline-flex items-center justify-center bg-white gap-2 border-slate-200 text-slate-700 hover:border-slate-400 hover:text-slate-900 hover:shadow transition duration-150"
				type="submit"
			>
				<GoogleIcon />
				<span>Continue with Google</span>
			</button>
		</form>
	);
};

export default GoogleAuthButton;
