import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

// Styled components for the busy animation elements
const BusySwitchBorder = styled.div`
	position: absolute;
	top: -6px;
	left: -6px;
	right: -6px;
	bottom: -6px;
	border: 2px solid #ffcc00;
	border-radius: 12px;
	z-index: 10;
`;

const BusyDot = styled.div`
	position: absolute;
	width: 10px;
	height: 10px;
	background-color: #ffcc00;
	border-radius: 5px;
	z-index: 1;
`;

const BusyAnimationSection = ({ isBusy, borderDimensions }) =>
{
	const [dotPosition, setDotPosition] = useState({ top: 0, left: 0 });
	const startTimeRef = useRef(0);

	useEffect(() =>
	{
		let animationFrameId = null;

		const animateDot = (timestamp) =>
		{
			if (!startTimeRef.current)
			{
				startTimeRef.current = timestamp;
			}

			const elapsed = timestamp - startTimeRef.current;
			const position = (elapsed % 2000) / 2000;

			const { width, height } = borderDimensions;
			const perimeter = 2 * (width + height);

			let x, y;
			const w = width;
			const h = height;

			if (position < w / perimeter)
			{
				x = position * perimeter;
				y = -5;
			}
			else if (position < (w + h) / perimeter)
			{
				x = w;
				y = position * perimeter - w;
			}
			else if (position < (2 * w + h) / perimeter)
			{
				x = w - (position * perimeter - w - h);
				y = h;
			}
			else
			{
				x = -5;
				y = h - (position * perimeter - 2 * w - h);
			}

			setDotPosition({ top: y, left: x });

			animationFrameId = requestAnimationFrame(animateDot);
		};

		if (isBusy)
		{
			startTimeRef.current = 0;
			animationFrameId = requestAnimationFrame(animateDot);
		}
		else
		{
			setDotPosition({ top: 0, left: 0 });
		}

		return () =>
		{
			if (animationFrameId)
			{
				cancelAnimationFrame(animationFrameId);
			}
		};
	}, [isBusy, borderDimensions]);

	if (!isBusy) return null;

	return (
		<>
			<BusySwitchBorder />
			<BusyDot style={{ top: dotPosition.top, left: dotPosition.left }} />
		</>
	);
};

export default BusyAnimationSection;
