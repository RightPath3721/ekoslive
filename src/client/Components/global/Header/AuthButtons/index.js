import React, { useCallback, useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { login } from "@redux/actions";
import userService from "@services/userService";
import LoginForm from "@components/sections/LoginForm";
import RegisterModal from "@components/sections/RegisterForm";
// import ForgetPassword from "@components/ForgetPassword";

const MODAL_NAMES = {
	login: "LOGIN",
	register: "REGISTER",
	forgetPassword: "FORGET_PASSWORD",
};

const AuthButtons = ({ mode = "button", setMode }) =>
{
	const dispatch = useDispatch();
	const [activeModal, setActiveModal] = useState(mode === "LOGIN" ? MODAL_NAMES.login : "");

	useEffect(() =>
	{
		if (mode === "LOGIN") setActiveModal(MODAL_NAMES.login);
	}, [mode]);

	const closeModal = useCallback(() =>
	{
		setActiveModal("");
		if (setMode) setMode("");
	}, [setActiveModal, setMode]);

	const handleOpenLogin = () =>
	{
		setActiveModal(MODAL_NAMES.login);
	};

	const handleOpenRegister = () =>
	{
		setActiveModal(MODAL_NAMES.register);
	};

	const handleSubmit = useCallback(
		async (credentials, type = "login") =>
		{
			const userApiResponse = // Renamed to avoid confusion with Redux state user
				type === "login"
					? await userService.login(credentials)
					: await userService.register(credentials);

			if (typeof userApiResponse !== "string" && userApiResponse.success)
			{
				// Dispatch the main login action to store auth details (token, username etc.)
				// This login action should ideally take userApiResponse as payload
				// For now, assuming it correctly populates auth state needed for subsequent calls
				dispatch(login({ username: userApiResponse.username, token: userApiResponse.token })); // Or however login action expects its payload

				// After successful login and auth state is updated, fetch user settings
				// This requires user.username and user.token to be available from Redux store or userApiResponse
				if (userApiResponse.username && userApiResponse.token)
				{
					try
					{
						const settingsUrl = `/api/user/settings?username=${encodeURIComponent(userApiResponse.username)}&token=${userApiResponse.token}`;
						// Assuming ekosliveServer is configured for API calls (imported from @client/config)
						// If not, use raw fetch or a globally configured axios instance.
						// For now, let's assume we need to import ekosliveServer if not already.
						// const { ekosliveServer } = await import("@client/config"); // Dynamic import if needed, or ensure it's available

						// This part assumes ekosliveServer is available. If not, it needs to be imported or passed.
						// Let's assume it's available via a direct import if this component is part of the main client bundle.
						// If this component is truly global and @client/config is not directly accessible,
						// this fetch logic might need to be in a Redux thunk itself.

						// For now, directly using fetch as it's universally available in browser context.
						const response = await fetch(settingsUrl, {
							method: 'GET',
							headers: { 'Content-Type': 'application/json' },
						});

						if (!response.ok)
						{
							const errorData = await response.text();
							throw new Error(`Failed to fetch user settings: ${response.status} ${errorData}`);
						}
						const settingsData = await response.json();

						if (settingsData.success && settingsData.settings)
						{
							const { optionActions } = await import("@redux/actions/options.actions.js"); // Ensure correct path
							const { optionsConstants } = await import("@redux/constants/options.constants.js");
							if (typeof settingsData.settings.ekosLiveCloudEnabled === 'boolean')
							{
								dispatch(optionActions.setOption(optionsConstants.ekosLiveCloud, settingsData.settings.ekosLiveCloudEnabled));
								console.log("EkosLive Cloud option initialized from server settings:", settingsData.settings.ekosLiveCloudEnabled);
							}
						} else
						{
							console.error("Failed to parse user settings from API:", settingsData.message);
						}
					} catch (error)
					{
						console.error("Error fetching user settings after login:", error);
					}
				}
			}
			return userApiResponse; // Return the original API response
		},
		[dispatch],
	);

	return (
		<div className="flex-center gap-2 lg:gap-4">
			{mode === "button" && (
				<>
					<button
						className="auth-button min-w-16 lg:min-w-24 focus-visible:text-primary-orange focus-visible:border focus-visible:border-transparent hover:bg-primary-orange border hover:border-transparent px-4 lg:px-6 bg-transparent border-white"
						type="button"
						onClick={() => setActiveModal(MODAL_NAMES.login)}
						name="login"
					>
						Login
					</button>
					<button
						className="auth-button min-w-16 lg:min-w-24 px-[0.875rem] lg:px-[1.125rem] focus-visible:bg-transparent focus-visible:text-primary-orange"
						type="button"
						onClick={() => setActiveModal(MODAL_NAMES.register)}
						name="sign up"
					>
						SignUp
					</button>
				</>
			)}

			<LoginForm
				onClose={closeModal}
				handleSubmit={handleSubmit}
				openForgetForm={() => setActiveModal(MODAL_NAMES.forgetPassword)}
				open={activeModal === MODAL_NAMES.login}
				onSwitchToRegister={handleOpenRegister}
			/>

			<RegisterModal
				onClose={closeModal}
				handleSubmit={handleSubmit}
				open={activeModal === MODAL_NAMES.register}
				onSwitchToLogin={handleOpenLogin}
			/>
			{/* <Modal
				onClose={closeModal}
				open={activeModal === MODAL_NAMES.forgetPassword}
			>
				<ForgetPassword onClose={closeModal} />
			</Modal> */}
		</div>
	);
};

export default AuthButtons;
