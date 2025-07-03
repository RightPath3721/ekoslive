import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";

const RemoteTooltip = () =>
{
	return (
		<Box sx={{ padding: ".5rem" }}>
			<Typography color="primary">{s.tooltip.remote_description} </Typography>
			<Typography>"ZWO ASI120MC"@192.168.1.50:8000</Typography>

			<Typography mt=".5rem" color="primary">
				{s.tooltip.remote_zwo_description}
			</Typography>
			<Typography>"EQMod Mount"@192.168.1.50:800</Typography>

			<Typography mt=".5rem" color="primary">
				{s.tooltip.remote_eqmod_description}
			</Typography>
			<Typography>@192.168.1.50:8000</Typography>

			<Typography mt=".5rem" color="primary">
				{s.tooltip.remote_port}
			</Typography>
			<Typography>@192.168.1.50</Typography>
			<Typography>{s.tooltip.remote_ip}</Typography>

			<Typography mt=".5rem" color="primary">
				{s.tooltip.remote_info}
			</Typography>
		</Box>
	);
};

export default RemoteTooltip;
