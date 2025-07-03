import { useEffect } from "react";

/**
 * Hook that detects clicks outside of a specified element.
 * @param {React.MutableRefObject} ref - Reference to the DOM element to monitor for outside clicks.
 * @param {Function} handler - Callback function to execute when an outside click is detected.
 */
const useOutsideClick = (ref, handler) =>
{
    useEffect(() =>
    {
        const handleClickOutside = (event) =>
        {
            if (ref.current && !ref.current.contains(event.target))
            {
                if (typeof handler === 'function') {
                    handler();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside, true);
        return () =>
        {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [ref, handler]);

};

export default useOutsideClick;