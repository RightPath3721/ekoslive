import React, { createContext, useContext, useState } from "react";

const initialData = {
    equipmentList: [],
    setEquipmentList: () => { },
};

const EquipmentContext = createContext(initialData);

export const useEquipmentContext = () => useContext(EquipmentContext);

const EquipmentContextProvider = ({ children }) =>
{
    const [equipmentList, setEquipmentList] = useState([]);

    return (
        <EquipmentContext.Provider
            value={{
                equipmentList,
                setEquipmentList,
            }}
        >
            {children}
        </EquipmentContext.Provider>
    );
};

export default EquipmentContextProvider;
