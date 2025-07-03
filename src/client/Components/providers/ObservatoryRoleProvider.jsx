import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import useActiveUser from "@hooks/useActiveUser";
import { selectActiveKStarID } from "@redux/selectors";
import { useSelector } from "react-redux";

export const ObservatoryRoleContext = createContext(null);

export const useObservatoryRole = () => useContext(ObservatoryRoleContext);

const ObservatoryRoleProvider = ({ children }) => {
  const user = useActiveUser();
  const activeObservatoryId = useSelector(selectActiveKStarID);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !activeObservatoryId) {
        setRole("renter");
        return;
      }

      try {
        const data = {
          role: "owner"
        }
        // const { data } = await axios.get("/api/observatories/role", {
        //   params: { 
        //     username: user.username, 
        //     machineID: activeObservatoryId 
        //   }
        // });
        setRole(data.role);
      } catch (error) {
        console.error("Failed to fetch user role:", error);
        setRole(null);
      }
    };

    fetchUserRole();
  }, [user, activeObservatoryId]);

  return (
    <ObservatoryRoleContext.Provider value={role}>
      {children}
    </ObservatoryRoleContext.Provider>
  );
};

export default ObservatoryRoleProvider;
