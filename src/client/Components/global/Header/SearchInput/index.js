import React from "react";
import { useMediaQuery } from "react-responsive";
import SearchIcon from "@client/icons/SearchIcon";

const SearchInput = () =>
{
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });

	return (
		<label className="hidden md:block relative font-raleway">
			<input
				className="w-full py-3 md:py-4 sm:pl-[0.625rem] lg:pl-6 lg:pr-10 sm:min-w-[120px] xl:min-w-[320px] 2xl:min-w-[400px] sm:text-xs lg:text-base bg-white-10 rounded-[100px] disable-focus placeholder:italic placeholder:text-white-70 placeholder:capitalize text-white"
				placeholder="search here..."
			/>
			<button
				className="center-absolute translate-x-0 left-auto sm:right-4 right-7 disable-focus focus-within:text-primary-orange text-white"
				type="button"
				name="search"
				aria-label="search"
			>
				<SearchIcon
					width={isLargeScreen ? 24 : 18}
					height={isLargeScreen ? 24 : 18}
				/>
			</button>
		</label>
	);
};

export default SearchInput;
