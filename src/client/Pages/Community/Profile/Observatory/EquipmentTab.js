import React from "react";
import ProfileList from "./ProfileList";
import EquipmentContextProvider from "./Equipment/EquipmentContext";

const EquipmentTab = () =>
{
    return (
        <EquipmentContextProvider>
            <ProfileList />
        </EquipmentContextProvider>
    )
};

export default EquipmentTab