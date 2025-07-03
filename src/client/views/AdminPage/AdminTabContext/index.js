import React, { createContext, useContext, useState } from "react";

const initialValue = {
    usernameFilter: "",
    setUsernameFilter: () => { },
};

const AdminContext = createContext(initialValue);

export const useAdminContext = () => useContext(AdminContext);

const AdminContextProvider = ({ children }) =>
{
    const [usernameFilter, setUsernameFilter] = useState("");

    return (
        <AdminContext.Provider value={{ usernameFilter, setUsernameFilter }}>
            {children}
        </AdminContext.Provider>
    );
};

export default AdminContextProvider;
