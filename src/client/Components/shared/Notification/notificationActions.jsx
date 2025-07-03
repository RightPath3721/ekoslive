import React from "react";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export const navigateAction = (navigate, actionType, actionId) => {
    switch (actionType) {
        case 'Post':
            if(actionId) {
                navigate(`/community/post/${actionId}`);
            } else {
                navigate("/community");
            };
            break;
        case 'Comment':
            if(actionId) {
                navigate(`/community/post/${actionId}#comments`);
            } else {
                navigate("/community");
            };
            break;
        case 'Equipment':
            navigate("/community/equipment");
            break;
        case 'Moderation':
            navigate("/community/moderation");
            break;
        case 'Observatory':
            navigate("/community/profile/observatories");
            break;
        case 'Booking':
            navigate(`/community/bookings`);
            break;
        default:
            break;
    }
};

const NotificationActions = ({ actionType, actionId, handleClose, markAsRead, notificationId, index }) => {
    const navigate = useNavigate();

    const handleAction = () => {
        handleClose && handleClose();
        navigateAction(navigate, actionType, actionId);
        markAsRead && markAsRead(index, notificationId);
    };

    return (
        <Button
            sx={{
                ml: 2,
                bgcolor: "#ff6600",
                padding: "2px 8px",
                borderRadius: "16px",
            }}
            variant="contained"
            onClick={handleAction}
        >
            {`${actionType} ->`}
        </Button>
    )
};

export default NotificationActions;