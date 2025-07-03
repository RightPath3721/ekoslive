import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import TabLoader from "../../Components/TabLoader";
import { captureException } from "@sentry/browser";

const styles = {
  root: {
    margin: "auto",
    backgroundColor: "white",
    height: "93vh",
    display: "grid",
    placeItems: "center",
  },
};

const LoginPage = () => {
  const user = useSelector(selectUser);

  useEffect(() => {
    (async () => {
      const currentUser = await JSON.parse(localStorage.getItem("currentUser"));
      try {
        if (!user && !currentUser) {
          window.location.href = "/";
        }
      } catch (error) {
        captureException(error);
      }
    })();
  }, [user]);

  return (
    <div style={styles.root}>
      <TabLoader />
    </div>
  );
};

const connectedLoginPage = LoginPage;
export { connectedLoginPage as LoginPage };
