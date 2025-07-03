import React, { useState } from "react";
import { toast } from "react-toastify";
import Modal from "@mui/material/Modal";
import { useDispatch } from "react-redux";
import CloseModalButton from "@components/shared/CloseModalButton";
import GoogleAuthButton from "@components/global/Header/AuthButtons/GoogleAuthButton";
import { login } from "@redux/actions";

const LoginModal = ({ onClose, handleSubmit, open, onSwitchToRegister }) =>
{
	const dispatch = useDispatch();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const onSubmit = async (e) =>
	{
		e.preventDefault();

		setIsLoading(true);
		const credentials = {
			username,
			password,
		};
		setUsername("");
		setPassword("");
		try
		{
			const response = await handleSubmit(credentials, "login");
			if (typeof response === "string")
			{
				toast.error(response);
				setIsLoading(false);
				return;
			}
			dispatch(login(credentials));
			onClose();
		}
		catch (error)
		{
			toast.error(error.message);
		}
		setIsLoading(false);
	};

	return (
		<Modal open={open} onClose={onClose}>
			<div className="center-absolute min-w-[200px] sm:min-w-[416px] bg-[#151515] rounded-xl px-8 pt-9 pb-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex flex-col gap-8">
				<form
					id="login-form"
					onSubmit={onSubmit}
					className="flex flex-col gap-4"
				>
					<h2 className="text-white raleway text-3xl font-medium text-center">
						Login
					</h2>
					<div className="flex items-center justify-center gap-2 bg-[#252525] p-3 rounded-lg">
						<svg className="w-5 h-5 text-primary-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<p className="text-white/90 text-sm">
							Sign in with your <span className="text-primary-orange font-medium">stellarmate.com</span> account
						</p>
					</div>
					<label className="text-white text-sm font-medium flex flex-col gap-2">
						Email or Username
						<input
							name="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							type="text"
							autoComplete="username webauthn"
							className="input"
							required
						/>
					</label>
					<label className="text-white text-xs flex flex-col gap-2">
						Password
						<input
							name="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							type="password"
							autoComplete="current-password webauthn"
							className="input"
							required
						/>
					</label>
				</form>
				<div className="flex-center flex-col gap-3">
					<div className="flex-center flex-col justify-between gap-4 w-full">
						<button
							className="primary-btn w-full shadow-none rounded capitalize"
							form="login-form"
							type="submit"
						>
							login
						</button>
						{/* <GoogleAuthButton /> */}
					</div>
					{/* <button
					className="bg-transparent text-white underline capitalize text-focus"
					type="button"
				>
					forgot password or username
				</button> */}
					<p className="text-white text-sm">
						Don't have an account?{" "}
						<button
							onClick={onSwitchToRegister}
							className="text-primary-orange underline capitalize text-focus"
							type="button"
						>
							Sign up
						</button>
					</p>
				</div>

				<CloseModalButton close={onClose} label="close login dialog" />

				{isLoading && <div className="absolute inset-0 opacity-40 bg-white" />}
			</div>
		</Modal>
	);
};

export default LoginModal;
