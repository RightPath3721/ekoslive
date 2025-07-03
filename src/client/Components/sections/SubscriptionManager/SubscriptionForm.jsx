import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormField from "@components/shared/FormField";
import CitySelector from "./CitySelector";
import subscriptionService from "@services/subscriptionService";
import useActiveUser from "@hooks/useActiveUser";

const FormSchema = z.object({
	first_name: z.string(),
	last_name: z.string(),
	organization: z.string().optional(),
	address: z.string().optional(),
	address2: z.string().optional(),
	city: z.string().optional(),
	zip: z.string().optional(),
	country: z.string().optional(),
	state: z.string().optional(),
	phone: z.string().optional(),
	fax: z.string().optional(),
	email: z.string().email(),
	comment: z.string().min().optional(),
});

const SubscriptionForm = ({ submit, action, close }) =>
{
	const user = useActiveUser();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({
		resolver: zodResolver(FormSchema),
		defaultValues: async () =>
			subscriptionService.getActiveSubscriptionData(user),
	});
	const [isLoading, setIsLoading] = useState(false);

	const onSubmit = async (data) =>
	{
		setIsLoading(true);

		try
		{
			FormSchema.parse(data);
			await submit(user, data);
		}
		catch (error)
		{
			console.error(error);
		}
		setIsLoading(false);
		close();
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="relative w-full max-h-[500px] overflow-y-scroll bg-black-primary rounded-lg p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] flex flex-col gap-8"
		>
			<CitySelector register={register} />

			<FormField
				type="text"
				placeholder="First Name"
				name="first_name"
				register={register}
				error={errors.firstName}
				required
			/>

			<FormField
				type="text"
				placeholder="Last Name"
				name="last_name"
				register={register}
				error={errors.lastName}
				required
			/>

			<FormField
				type="text"
				placeholder="Organization"
				name="organization"
				register={register}
				error={errors.organization}
			/>

			<FormField
				type="text"
				placeholder="Address"
				name="address"
				register={register}
				error={errors.address}
			/>

			<FormField
				type="text"
				placeholder="Address 2"
				name="address2"
				register={register}
				error={errors.address2}
			/>

			<FormField
				type="text"
				placeholder="zip"
				name="zip"
				register={register}
				error={errors.zip}
			/>

			<FormField
				type="number"
				placeholder="Phone"
				name="phone"
				register={register}
				error={errors.phone}
			/>

			<FormField
				type="text"
				placeholder="Fax"
				name="fax"
				register={register}
				error={errors.fax}
			/>

			<FormField
				type="email"
				placeholder="Email"
				name="email"
				register={register}
				error={errors.email}
			/>

			<FormField
				type="text"
				placeholder="Comment"
				name="comment"
				register={register}
				error={errors.comment}
			/>

			<button
				className="primary-btn capitalize w-[120px] mx-auto"
				type="submit"
			>
				{action}
			</button>

			{isLoading && <div className="absolute inset-0 opacity-40 bg-white" />}
		</form>
	);
};

export default SubscriptionForm;
