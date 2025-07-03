import { useCallback, useState } from "react";

/**
 * Custom hook to manage the open/closed state of a modal.
 * @param {boolean} [defaultValue=false] - The initial state of the modal (open or closed).
 * @returns {[boolean, () => void]} An array containing the open state [first value] and a toggle function [second value] for the modal.
 * @example
 * const [isModalOpen, toggleIsModalOpen] = useModalState();
 * const [openByDefault, toggleOpenByDefault] = useModalState(true);
 */
const useModalState = (defaultValue = false) =>
{
	// State to track whether the modal is open or closed
	const [open, setOpen] = useState(defaultValue);

	/**
	 * Function to toggle the modal's open state.
	 * @function
	 */
	const toggle = useCallback(() => setOpen((prev) => !prev), [setOpen]);

	return [open, toggle];
};

export default useModalState;
