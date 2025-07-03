import React from "react";
import { footerLinks } from "@constants/footerLinkList";

const FooterLinkList = () =>
{
	return (
		<ul className="grid grid-cols-3 gap-11 lg:gap-14 items-start justify-center">
			{footerLinks.map((links) => (
				<li key={links.title}>
					<p className="font-raleway text-base font-medium">{links.title}</p>
					<ul className="grid grid-cols-1 gap-[0.75rem] mt-[0.875rem]">
						{links.links.map((link) => (
							<li key={link.title}>
								<a
									className="text-secondary text-sm text-focus"
									href={link.path}
									{...(link.thirdParty
										? {
												target: "_blank",
												rel: "noopener noreferrer",
											}
										: {})}
								>
									{link.title}
								</a>
							</li>
						))}
					</ul>
				</li>
			))}
		</ul>
	);
};

export default FooterLinkList;
