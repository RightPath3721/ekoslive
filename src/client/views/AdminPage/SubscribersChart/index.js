import React, { useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { VictoryPie } from "victory";
import useUsers from "../../../hooks/admin/useUsers";
import { styles } from "../../../shared/styles";
import { Palette } from "@common/shared/common/styles";

const SubscribersChart = () =>
{
	const { getSubscribersCount } = useUsers();
	const [monthlyIncome, setMonthlyIncome] = useState(null);

	useEffect(() =>
	{
		(async () =>
		{
			const data = await getSubscribersCount();
			if (!data) return;
			setMonthlyIncome(
				Object.values(data).reduce((acc, item) =>
				{
					if (isEmpty(item[0])) return acc;
					const [key, value] = Object.entries(item[0])[0];
					switch (key)
					{
						case "pro_annual_count":
							return (acc + 5) * value;
						case "pro_montly_count":
							return (acc + 5.99) * value;
						case "ultimate_annual_count":
							return (acc + 9.99) * value;
						case "ultimate_montly_count":
							return (acc + 11.5) * value;

						default:
							return acc;
					}
				}, 0),
			);
		})();
	}, []);

	return (
		<Box
			sx={[
				styles.center,
				{
					position: "absolute",
					height: "60px",
					top: ".5rem",
					right: ".5rem",
					gap: ".25rem",
				},
			]}
		>
			<Typography variant="body1" sx={{ whiteSpace: "nowrap" }}>
				2025 Goal($ / month):&nbsp;
			</Typography>
			<VictoryPie
				animate={{ duration: 1500 }}
				data={[
					{ x: 0, y: monthlyIncome },
					{ x: 0, y: 5000 },
				]}
				colorScale={[Palette.orange, Palette.grey33]}
			/>
		</Box>
	);
};
export default SubscribersChart;
