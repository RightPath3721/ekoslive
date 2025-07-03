import { Box } from "@mui/material";
import React, { useRef } from "react";
import { createPortal } from "react-dom";
import useDrag from "@hooks/useDrag";
import useOutsideClick from "@hooks/useOutsideClick";
import CloseButton from "./CloseButton";
import { get } from "lodash";

const sizes = {
	sm: {
		width: "280px",
		height: "290px",
	},
	xl: {
		width: "820px",
		height: "fit-content",
	},
	default: {
		width: "fit-content",
		height: "fit-content",
	},
};

/**
 * A draggable dialog component that allows users to drag it around the screen.
 * @param {{x: string, y: string}} props.initialValue - Initial position of component.
 * @param {object} props - Component props to redefine or add props.
 * @param {object} sx - Style object to redefine or add styles.
 * @param {boolean} outsideClick - Enable/disable outside click.
 * @param {React.ReactNode} props.children - The content of the dialog.
 * @param {*} props.sx - Styles for container to override.
 * @param {"sm"|"xl"|"default"} props.size - Modal container size.
 * @param {Function} props.onClose - Function to close modal.
 * @param {boolean} props.outsideClick - Indicates either to close modal on outside click or not.
 * @returns {React.ReactNode} - The draggable dialog component.
 */
const EkosModal = ({
	initialValue = { x: "50%", y: "50%" },
	sx = {},
	children,
	size = "default",
	onClose,
	outsideClick = true,
	...props
}) =>
{
	const dragRef = useRef();

	const { position, handleMouseDown } = useDrag({
		ref: dragRef,
		initialValue,
	});
	if (outsideClick) useOutsideClick(dragRef, onClose);

	return createPortal(
		<Box
			ref={dragRef}
			sx={{
				position: "absolute",
				top: position.y,
				left: position.x,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "12px",
				zIndex: 1000,
				backgroundColor: "rgb(16, 16, 16)",
				border: "1px solid #FFFCFA24",
				padding: "18px",
				borderRadius: "4px",
				margin: 0,
				boxSizing: "border-box",
				minWidth: "fit-content",
				...sizes[size],
				...sx,
			}}
			onMouseDown={handleMouseDown}
			component="dialog"
			{...props}
		>
			{!get(props, "showXIcon", false) && (
				<CloseButton onChange={onClose} top="4px" right="4px" />
			)}
			{children}
		</Box>,
		document.body,
	);
};

export default EkosModal;
