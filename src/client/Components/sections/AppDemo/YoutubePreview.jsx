import React from "react";
import { useMediaQuery } from "react-responsive";

const YoutubePreview = () =>
{
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });

	return (
		<iframe
			width="100%"
			height={isMediumScreen ? "640px" : "320px"}
			src="https://www.youtube-nocookie.com/embed/pMnokQycCSw"
			title="Stella Smart Digital Assistant"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			referrerPolicy="strict-origin-when-cross-origin"
			allowFullScreen
			style={{ color: "white" }}
		/>
	);
};

export default YoutubePreview;
