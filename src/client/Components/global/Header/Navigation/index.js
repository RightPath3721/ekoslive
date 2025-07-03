import React, { useState } from "react";
import { useMediaQuery } from "react-responsive";
import NavigationList from "./NavigationList";
import BurgerIcon from "@client/icons/BurgerIcon";
import MobileMenu from "../MobileMenu";

const Navigation = () =>
{
	const [isOpen, setIsOpen] = useState(false);
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return (
		<>
			{isMediumScreen ? (
				<NavigationList />
			) : (
				<button
					aria-label="open navigation menu"
					name="burger"
					onClick={() => setIsOpen((prev) => !prev)}
					className="ml-auto my-auto w-min h-min"
					type="button"
				>
					<BurgerIcon
						isOpen={isOpen}
						transition={{ ease: "easeOut", duration: 0.2 }}
						strokeWidth={2}
						width={28}
						height={20}
					/>
				</button>
			)}
			{!isMediumScreen && <MobileMenu isOpen={isOpen} />}
		</>
	);
};

export default Navigation;
