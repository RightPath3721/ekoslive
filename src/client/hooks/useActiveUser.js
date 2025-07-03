import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";

/**
 * This custom hook retrieves the active user data from the Redux store(instead of importing each time useSelector with selectUser we can just import one hook).
 * @returns {object | null} The active user object from the Redux store, 
 * or null if no user is logged in.
 */
const useActiveUser = () =>
{
    const user = useSelector(selectUser);

    return user;
}

export default useActiveUser