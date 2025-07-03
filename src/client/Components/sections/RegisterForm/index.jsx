import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from "react-toastify";
import Modal from "@mui/material/Modal";
import FormField from "@components/shared/FormField";
import CloseModalButton from "@components/shared/CloseModalButton";
import GoogleAuthButton from "@components/global/Header/AuthButtons/GoogleAuthButton";

const UserSchema = z
	.object({
		name: z.string().min(1, { message: "Name is required" }),
		email: z.string().email(),
		password: z.string().min(8, { message: "Password is too short" }),
		confirmPassword: z.string().min(8),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});

const RegisterModal = ({ onClose, handleSubmit: submit, open, onSwitchToLogin }) =>
{
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({
		resolver: zodResolver(UserSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});
	const [isLoading, setIsLoading] = useState(false);
	const [recaptchaValue, setRecaptchaValue] = useState(null);

	const onSubmit = async (data) =>
	{
		setIsLoading(true);

		if (!recaptchaValue)
		{
			toast.error("Please complete the reCAPTCHA.");
			setIsLoading(false);
			return;
		}

		try
		{
			UserSchema.parse(data);
			const result = await submit({ ...data }, "register");
			if (!result.success) throw new Error(result.message);
			reset();
			toast.success(result.message);
			onClose();
		}
		catch (error)
		{
			toast.error(error.message);
			reset({
				...data,
				password: "",
				confirmPassword: "",
			}, { 
				keepValues: true,  // This keeps other field values
				keepDirty: true
			});
		}
		finally
		{
			setIsLoading(false);
		}
	};

	const handleRecaptchaChange = (value) =>
	{
		setRecaptchaValue(value);
	};

	return (
		<Modal open={open} onClose={onClose}>
			<div className="center-absolute min-w-[200px] sm:min-w-[416px] bg-[#151515] rounded-xl p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex flex-col gap-8">
				<form
					id="register-form"
					onSubmit={handleSubmit(onSubmit)}
					className="flex flex-col gap-4"
				>
					<h2 className="text-white raleway text-3xl font-medium text-center">
						Register
					</h2>

					<FormField
						type="text"
						placeholder="Full Name"
						name="name"
						register={register}
						error={errors.name}
						label="Full Name"
						autoComplete="given-name family-name"
					/>

					<FormField
						type="email"
						placeholder="Email"
						name="email"
						register={register}
						error={errors.email}
						label="Email"
						autoComplete="email webauthn"
					/>

					<FormField
						type="password"
						placeholder="password"
						name="password"
						register={register}
						error={errors.password}
						label="Password"
						autoComplete="new-password"
					/>

					<FormField
						type="password"
						placeholder="confirm password"
						name="confirmPassword"
						register={register}
						error={errors.confirmPassword}
						label="Confirm Password"
						autoComplete="new-password"
					/>

					<ReCAPTCHA
						sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
						onChange={handleRecaptchaChange}
					/>
				</form>

				<div className="flex-center flex-col gap-3">
					<div className="flex-center flex-col justify-between gap-4 w-full">
						<button
							className="primary-btn w-full shadow-none rounded capitalize"
							form="register-form"
							type="submit"
							disabled={isLoading}
						>
							{isLoading ? "Registering..." : "Register"}
						</button>
						{/* <GoogleAuthButton /> */}
					</div>
					<p className="text-white text-sm">
						Already have an account?{" "}
						<button
							onClick={onSwitchToLogin}
							className="text-primary-orange underline capitalize text-focus"
							type="button"
						>
							Login
						</button>
					</p>
				</div>

				<CloseModalButton close={onClose} label="close register dialog" />
				{isLoading && <div className="absolute inset-0 opacity-40 bg-white" />}
			</div>
		</Modal>
	);
};

export default RegisterModal;
