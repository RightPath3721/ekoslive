import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { URLS } from "@constants/urls";
import { selectUser } from "@redux/selectors";
import { useSelector } from "react-redux";

const LinkList = () =>
{
	const user = useSelector(selectUser);
	return (
		<ul className="grid justify-center gap-2 sm:flex-center sm:gap-4 lg:gap-8">
			{URLS.map((link, idx) => (
				<motion.li
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{
						type: "spring",
						stiffness: 260,
						damping: 20,
						delay: 0.1 + idx / 10,
					}}
					className="font-raleway text-sm lg:text-base font-normal text-white-70 hover:underline decoration-white-70"
					key={link.path}
				>
					<a
						className="flex items-center justify-center sm:justify-between w-full p-5 sm:p-0 rounded-xl disable-focus focus-within:text-primary-orange"
						href={link.path}
					>
						{link.name}
					</a>
				</motion.li>
			))}
			{!user && (
				<motion.li
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{
						type: "spring",
						stiffness: 260,
						damping: 20,
					}}
					className="font-raleway text-sm lg:text-base font-normal text-white-70 hover:underline decoration-white-70"
					key="/community"
				>
					<Link
						className="flex items-center justify-center sm:justify-between w-full p-5 sm:p-0 rounded-xl disable-focus focus-within:text-primary-orange"
						to="/community"
					>
						Community
					</Link>
				</motion.li>
			)}
		</ul>
	);
};

export default LinkList;
