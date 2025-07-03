import { useMemo, useRef } from "react";

const useLongPress = (
  callback,
  { threshold = 400, onStart, onFinish, onCancel } = {}
) => {
  const isLongPressActive = useRef(false);
  const isPressed = useRef(false);
  const timerId = useRef();

  const isMouseEvent = (event) => event.type.startsWith("mouse");
  const isTouchEvent = (event) => event.type.startsWith("touch");

  return useMemo(() => {
    if (typeof callback !== "function") {
      return {};
    }

    const start = (event) => {
      if (!isMouseEvent(event) && !isTouchEvent(event)) return;

      if (onStart) {
        onStart(event);
      }

      isPressed.current = true;
      timerId.current = setTimeout(() => {
        callback(event);
        isLongPressActive.current = true;
      }, threshold);
    };

    const cancel = (event) => {
      if (!isMouseEvent(event) && !isTouchEvent(event)) return;

      if (isLongPressActive.current) {
        if (onFinish) {
          onFinish(event);
        }
      } else if (isPressed.current) {
        if (onCancel) {
          onCancel(event);
        }
      }

      isLongPressActive.current = false;
      isPressed.current = false;

      if (timerId.current) {
        window.clearTimeout(timerId.current);
      }
    };

    const mouseHandlers = {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
    };

    const touchHandlers = {
      onTouchStart: start,
      onTouchEnd: cancel,
    };

    return {
      ...mouseHandlers,
      ...touchHandlers,
    };
  }, [callback, threshold, onCancel, onFinish, onStart]);
};

export default useLongPress;