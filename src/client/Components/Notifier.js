import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { isEmpty, isEqual } from "lodash";
import { SNACKBAR_VARIANTS, notificationConstants } from "@redux/constants";
import { selectNotification } from "@redux/selectors";
import { snackbarActions } from "@redux/actions";

const styles = {
	position: "bottom-right",
	autoClose: 2500,
	hideProgressBar: false,
	closeOnClick: true,
	pauseOnHover: true,
	draggable: true,
	progress: undefined,
	theme: "light",
};

const Notifier = () =>
{
	const dispatch = useDispatch();
	const notification = useSelector(selectNotification, isEqual);

	useEffect(() =>
	{
		if (!isEmpty(notification?.message))
		{
			let { message, severity, uuid } = notification;
			notify(severity, message);
			addNotification(notification);

			dispatch(snackbarActions.removeSnackbar(uuid));
		}
	}, [notification]);

	const addNotification = (data) =>
	{
		const { message, severity, uuid } = data;
		if (message && uuid && severity > 0)
		{
			const ts = +new Date();
			dispatch({
				type: notificationConstants.ADD_NOTIFICATION,
				payload: { message, uuid, severity, ts },
			});

			// Get existing notifications and limit to last 5
			const existingNotifications = document.querySelectorAll('.Toastify__toast');
			if (existingNotifications.length > 5) {
				for (let i = 0; i < existingNotifications.length - 5; i++) {
					toast.dismiss(existingNotifications[i]);
				}
			}
		}
	};

	/**
	 * Popup notification.
	 * @param {*} type - Error, info etc..
	 * @param {*} message - "Upload successful".
	 * @returns {void}
	 */
	const notify = (type, message) =>
	{
		if (type === SNACKBAR_VARIANTS.INFO) toast.info(message, styles);
		else if (type === SNACKBAR_VARIANTS.ERROR) toast.error(message, styles);
		else if (type === SNACKBAR_VARIANTS.SUCCESS) toast.success(message, styles);
		else if (type === SNACKBAR_VARIANTS.DEFAULT) toast(message, styles);
	};
	return (
		<ToastContainer
			position="top-right"
			autoClose={2500}
			hideProgressBar={false}
			newestOnTop={false}
			closeOnClick
			rtl={false}
			pauseOnFocusLoss
			draggable
			pauseOnHover
			theme="light"
			limit={5}
		/>
	);
};

export default Notifier;
