import React, { useCallback } from "react";
import { isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import EkosDialog from "./EkosDialog";
import { dialogActions } from "@redux/actions";
import { selectEkosDialogInfo } from "@redux/selectors";

/* Dialog box messages from Ekos that requires user interaction */
const EkosDialogHandler = () =>
{
    const dispatch = useDispatch();
    const dialogInfo = useSelector(selectEkosDialogInfo);

    const handleDialogResponse = useCallback((button) =>
    {
        dispatch(dialogActions.sendResponse(button));
    }, []);

    const handleDialogTimeout = useCallback(() =>
    {
        dispatch(dialogActions.dialogTimeout());
    }, []);

    if (isEmpty(dialogInfo))
        return null;

    else
        return <EkosDialog
            {...dialogInfo}
            defaultButton={dialogInfo["default"]}
            handleButtonAction={handleDialogResponse}
            handleTimeout={handleDialogTimeout}
        />
}

export default EkosDialogHandler;