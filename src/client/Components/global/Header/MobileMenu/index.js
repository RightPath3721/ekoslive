import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import UserMenu from "../UserMenu";
import AuthButtons from "../AuthButtons";
import LinkList from "../Navigation/LinkList";
import useActiveUser from "@hooks/useActiveUser";

const MobileMenu = ({ isOpen }) =>
{
	const user = useActiveUser();

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed left-0 shadow-4xl right-0 top-[72px] p-5 bg-black-secondary border-b border-b-white/20"
				>
					<LinkList />
					{user ? <UserMenu /> : <AuthButtons />}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default MobileMenu;
