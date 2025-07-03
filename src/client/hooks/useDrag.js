import { useCallback, useEffect, useState } from "react";

/**
 * A custom hook for enabling drag functionality on a DOM element.
 * @param {object} options - Options for the drag functionality.
 * @param {React.MutableRefObject} options.ref - Ref of the draggable DOM element.
 * @param {{x:number, y:number}} [options.initialValue] - Initial position of the draggable element.
 * @returns {object} - Object containing position and mouse event handler.
 */
const useDrag = ({ ref, initialValue = {} }) =>
{
	const [dragInfo, setDragInfo] = useState();
	const [finalPosition, setFinalPosition] = useState(initialValue);
	const [isDragging, setIsDragging] = useState(false);

	const updateFinalPosition = useCallback((width, height, x, y) =>
	{
		setFinalPosition({
			x: Math.min(Math.max(0, x), window.innerWidth - width),
			y: Math.min(Math.max(0, y), window.innerHeight - height),
		});
	}, []);

	const handleMouseUp = (evt) =>
	{
		evt.preventDefault();

		setIsDragging(false);
	};

	const handleMouseDown = (evt) =>
	{
		const { clientX, clientY } = evt;
		const { current: draggableElement } = ref;

		if (!draggableElement)
		{
			return;
		}

		const { top, left, width, height } =
			draggableElement.getBoundingClientRect();

		setIsDragging(true);
		setDragInfo({
			startX: clientX,
			startY: clientY,
			top,
			left,
			width,
			height,
		});
	};

	const handleMouseMove = useCallback(
		(evt) =>
		{
			const { current: draggableElement } = ref;

			if (!isDragging || !draggableElement) return;

			evt.preventDefault();

			const { clientX, clientY } = evt;

			const position = {
				x: dragInfo.startX - clientX,
				y: dragInfo.startY - clientY,
			};

			const { top, left, width, height } = dragInfo;

			updateFinalPosition(width, height, left - position.x, top - position.y);
		},
		[isDragging, dragInfo, ref, updateFinalPosition],
	);

	useEffect(() =>
	{
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("mouseup", handleMouseUp);

		return () =>
		{
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [handleMouseMove]);

	return {
		position: finalPosition,
		handleMouseDown,
	};
};

export default useDrag;
