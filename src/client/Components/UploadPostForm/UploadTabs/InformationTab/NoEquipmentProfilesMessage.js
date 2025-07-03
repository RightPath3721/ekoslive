import React from "react";
import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const NoEquipmentProfilesMessage = ({ observatory }) =>
{
	return (
		<Typography>
			Selected observatory has no equipment profiles. To proceed please&nbsp;
			<MuiLink
				to={`/community/profile/observatories/${observatory}`}
				component={Link}
			>
				add
			</MuiLink>
			&nbsp;at least one.
		</Typography>
	);
};

export default NoEquipmentProfilesMessage;
