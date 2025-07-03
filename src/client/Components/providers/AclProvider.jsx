import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { subject as caslSubject } from "@casl/ability";
import { captureException } from "@sentry/browser";
import { createContextualCan } from "@casl/react";
import useActiveUser from "@hooks/useActiveUser";
import defineAbilityForClient from "@utils/defineAbility";

export const AbilityContext = createContext();

const ACLProvider = ({ children }) =>
{
	const user = useActiveUser();
	const [ability, setAbility] = useState(defineAbilityForClient());

	const fetchAclData = async () => {
		try {
			if (!user) return null;
			
			const url = "/api/acl/";
			const { data } = await axios.get(url, {
				params: { username: user?.username, token: user?.token },
			});
			setAbility(defineAbilityForClient(data.user, data.permissions));
		}
		catch (error)
		{
			captureException(error);
			setAbility({});
		}
	};

	useEffect(() =>
	{
		if (user)
		{
			fetchAclData();
		}
		
	}, [user]);

	return (
		<AbilityContext.Provider value={ability}>
			{children}
		</AbilityContext.Provider>
	);
};

export default ACLProvider;

const CaslCan = createContextualCan(AbilityContext.Consumer);

/**
 * React component to wrap the action which needs to be confiemd by ACL.
 * @param {object} props - Can component props.
 * @param {string|Array<string>} props.action - The name of the action("read", "update", "delete"), can be single action represented as a a string, or multiple actions represented as an array.
 * @param {string} props.subject - Subject, which is a name of collection in mongoDB that needs to be checked.
 * @param {string} [props.object] - Actual object, needs to be passed if permission requires specific conditions.
 * @param {string} props.children - Children components.
 * @returns {JSX.Element} The rendered greeting message.
 * @example
 *	<Can action="edit" subject="User">
 *	<Button>Edit</Button>
 *	</Can>
 *
 *	<Can action="delete" subject="Post" object={post}>
 *	<Button>Delete</Button>
 *	</Can>
 *
 *	<Can action=["update", "delete"] subject="User" object={user}>
 *	<Button>Delete</Button>
 *	</Can>
 */
export const Can = ({ action, subject, object, children, ...rest }) =>
{
	return (
		<CaslCan
			I={action}
			a={object ? undefined : subject}
			// call the caslSubject function to tell CASL what type of object it is, since there are no mongodb documents on the client side,
			// and we need to manually tell casl what subject this object belongs to
			this={object ? caslSubject(subject, object) : null}
			{...rest}
		>
			{children}
		</CaslCan>
	);
};
