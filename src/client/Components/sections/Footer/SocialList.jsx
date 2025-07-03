import React, { cloneElement } from "react";
import { socialList } from "@constants/socialList";

const SocialList = () =>
{
	return (
		<ul className="flex-center flex-row sm:flex-col gap-[0.875rem]">
			{socialList.map((social, idx) => (
				<li key={idx}>
					<a
						className="w-[34px] h-[34px] border-[0.7px] border-white-primary grid place-items-center rounded-full text-white-primary focus-button"
						href={social.link}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={social.description}
					>
						{cloneElement(social.icon, { width: 18, height: 18 })}
					</a>
				</li>
			))}
		</ul>
	);
};

export default SocialList;
