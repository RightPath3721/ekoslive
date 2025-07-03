import React, { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import useUsers from "../../../hooks/admin/useUsers";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../../shared/styles";

const ConnectedUsersCounter = () =>
{
	const { getCount } = useUsers();
	const [count, setCount] = useState(0);

	useEffect(() =>
	{
		(async () =>
		{
			const data = await getCount();
			setCount(data ?? 0);
		})();
	}, []);

	return (
		<Box sx={[styles.center, { gap: "0.5rem" }]}>
			<Typography>{s.general.online}</Typography>
			<Typography
				component="span"
				sx={{
					display: "block",
					textAlign: "center",
					padding: "0.125rem 0.5rem",
					backgroundColor: Palette.darkGreen,
					borderRadius: "6px",
				}}
			>
				{count}
			</Typography>
		</Box>
	);
};

export default ConnectedUsersCounter;
