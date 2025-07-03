import React from "react";
import { cn } from "@utils/cn";
import XIcon from "@client/icons/XIcon";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";

const CloseModalButton = ({ close, className, label, name, size }) =>
{
	const isLight = name === "light";
	const isCloud = name === "cloud";
	return (
		<button
			className={cn(`absolute top-4 right-4`, className)}
			onClick={close}
			type="button"
			style={{ position: "absolute", top: isLight || isCloud ? "60px" : "0px" }}
			aria-label={label}
			name={name}
		>
			{isLight ? (
				<FlashOnIcon
					style={{
						fontSize: size || "48px", // Set size dynamically or fallback to default
					}}
					className="text-[#9CA3AF] hover:text-primary-orange transition-colors"
				/>
			) : isCloud ? (
				<CloudQueueIcon
					style={{
						fontSize: size || "48px", // Set size dynamically or fallback to default
					}}
					className="text-[#9CA3AF] hover:text-primary-orange transition-colors"
				/>
			) : (
				<XIcon
					width={size}
					height={size}
					className="text-[#9CA3AF] hover:text-primary-orange transition-colors"
				/>
			)}
		</button>
	);
};

export default CloseModalButton;
