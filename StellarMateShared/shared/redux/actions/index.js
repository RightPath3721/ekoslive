import commands from "../../commands";
import { wssMessageSocketActions } from "./wssMessageSocketActions";

export * from "./achievements.actions";
export * from "./alert.actions";
export * from "./align.actions";
export * from "./cap.actions";
export * from "./capture.actions";
export * from "./context.actions";
export * from "./dialog.actions";
export * from "./dome.actions";
export * from "./ekos.actions";
export * from "./focus.actions";
export * from "./guide.actions";
export * from "./indi.actions";
export * from "./mount.actions";
export * from "./optical-train.actions";
export * from "./options.actions";
export * from "./polar.actions";
export * from "./profile.actions";
export * from "./progress.actions";
export * from "./scheduler.actions";
export * from "./setup.actions";
export * from "./snackbar.actions";
export * from "./stella.actions";
export * from "./targets.actions";
export * from "./user.actions";
export * from "./viewer.actions";
export * from "./wssMediaSocketActions";
export * from "./wssMessageSocketActions";
export * from "./notification.actions";
export * from "./booking.action";
export * from "./messages.actions";

// global actions
export const getStates = () =>
{
    return wssMessageSocketActions.sendText({}, commands.GET_STATES);
};
