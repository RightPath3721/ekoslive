import React, { useState } from "react";
import CloseModalButton from "../shared/CloseModalButton";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import userService from "@services/userService";
import FormField from "../shared/FormField";

const ForgetPasswordSchema = z.object({
	email: z.string().email(),
});

const ForgetPassword = ({ onClose }) =>
{
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm({ resolver: zodResolver(ForgetPasswordSchema) });
	const [isLoading, setIsLoading] = useState(false);

	const submit = async (email) =>
	{
		setIsLoading(true);
		try
		{
			reset();
			await userService.forgotPasswordOrUsername(email);
			setIsLoading(false);
			onClose();
		}
		catch (error)
		{
			setIsLoading(false);
			console.error(error);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(submit)}
			className="relative min-w-[400px] bg-black-primary rounded-lg p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex flex-col gap-8"
		>
			<h3>
				Please enter the email address associated with your User account. Your
				username will be emailed to the email address on file.
			</h3>

			<FormField
				name="email"
				error={errors.email}
				register={register}
				placeholder="email@example.com"
				type="email"
			/>

			<button className="primary-btn" type="submit">
				Submit
			</button>

			{isLoading && <div className="absolute inset-0 opacity-40 bg-white" />}
			<CloseModalButton label="close forget password dialog" close={onClose} />
		</form>
	);
};

export default ForgetPassword;
