import React from "react";
import { useLocation } from "react-router-dom";
import UserMenu from "../UserMenu";
import AuthButtons from "../AuthButtons";
import LinkList from "./LinkList";
import useActiveUser from "@hooks/useActiveUser";
import { cn } from "@utils/cn";

const NavigationList = () =>
{
	const user = useActiveUser();
	const { pathname } = useLocation();

	return (
		<nav className={cn("w-full flex-center justify-end sm:gap-7 lg:gap-10")}>
			{!pathname.includes("dashboard") && <LinkList />}
			{user ? <UserMenu /> : <AuthButtons />}
		</nav>
	);
};

export default NavigationList;
