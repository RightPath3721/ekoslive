import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { useLocation } from "react-router-dom";
import { headerAnimationConfig } from "@constants/animation";
import { cn } from "@utils/cn";
import useActiveUser from "@hooks/useActiveUser";
import Logo from "@client/icons/Logo";
import Navigation from "./Navigation";
import Breadcrumbs from "./Breadcrumbs";
import DashboardIndicators from "./DashboardIndicators";

const Header = () =>
{
	const user = useActiveUser();
	const isMediumScreen = useMediaQuery({ query: "(min-width: 768px)" });
	const { pathname } = useLocation();
	const [backgroundAnimation, setBackgroundAnimation] = useState(false);

	useEffect(() =>
	{
		setBackgroundAnimation(true);

		const timeout = setTimeout(() =>
		{
			setBackgroundAnimation(false);
		}, 2000);

		return () =>
		{
			clearTimeout(timeout);
		};
	}, [pathname]);

	return (
		<motion.header
			className={cn(
				"fixed z-10 grid gap-8 md:gap-3 lg:gap-7 xl:gap-12 w-full py-5 px-10 lg:px-16 header scrollbar-gutter-stable",
				user
					? "grid-cols-[auto,1fr] md:grid-cols-[repeat(2,auto)] lg:grid-cols-2 min-w-[100vw]"
					: "grid-cols-[auto,1fr] lg:grid-cols-2 min-w-[100vw]",
				pathname !== "/"
					? "!px-4 md:!px-[35px] 2xl:!px-[60px]"
					: "backdrop-blur-[6px]",
				backgroundAnimation
					? pathname === "/"
						? "header-ltr-animation"
						: "header-rtl-animation"
					: pathname === "/"
						? "!bg-[100%_50%]"
						: "!bg-[0%_50%]",
			)}
			{...headerAnimationConfig}
		>
			<div className="flex items-center gap-2 lg:gap-5 xl:gap-11">
				<Link to="/">
					<Logo
						height={isMediumScreen ? 28 : 20}
						width={isMediumScreen ? 40 : 30}
						variant="primary"
					/>
				</Link>
				{pathname.includes("community") && <Breadcrumbs />}
				{pathname.includes("dashboard") && <DashboardIndicators />}
			</div>
			<Navigation />
		</motion.header>
	);
};

export default Header;
