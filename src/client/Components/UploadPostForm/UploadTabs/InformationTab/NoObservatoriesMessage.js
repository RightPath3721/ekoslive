import React from "react";
import { Link } from "react-router-dom";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";

const NoObservatoriesMessage = () =>
{
	return (
		<Typography>
			You have no observatories. To proceed please&nbsp;
			<MuiLink to="/community/profile/observatories/" component={Link}>
				add
			</MuiLink>
			&nbsp;at least one.
		</Typography>
	);
};

export default NoObservatoriesMessage;
