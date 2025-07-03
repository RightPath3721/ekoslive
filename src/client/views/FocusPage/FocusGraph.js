import { isEmpty } from "lodash";
import React from "react";
import {
	VictoryAxis,
	VictoryChart,
	VictoryLabel,
	VictoryLine,
	VictoryScatter,
	VictoryTheme,
} from "victory";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import { Box } from "@mui/material";

const Graph = ({ chartData }) =>
{
	return (
		<Box sx={{ height: "275px", width: "300px" }}>
			<VictoryChart theme={VictoryTheme.material}>
				<VictoryLine interpolation="cardinal" data={chartData} />
				<VictoryScatter
					style={{
						data: {
							fill: ({ index }) =>
								index === chartData.length - 1
									? Palette.orange
									: Palette.magenta,
							opacity: 1,
						},
					}}
					labels={({ datum }) => datum.index}
					labelComponent={
						<VictoryLabel
							verticalAnchor="start"
							width="15px"
							style={{
								fill: ({ index }) =>
									index === chartData.length - 1
										? Palette.orange
										: Palette.magenta,
								backgroundColor: Palette.red,
								fontSize: "20px",
								fontWeight: "bold",
							}}
						/>
					}
					data={chartData}
				/>
				<VictoryAxis
					dependentAxis
					label={s.ekos.collapse_focus.hfr}
					axisLabelComponent={
						<VictoryLabel
							dy={-35}
							style={{ fill: "white", fontSize: "15px", fontWeight: "bold" }}
						/>
					}
					tickFormat={(t) => t.toFixed(2)}
				/>
				<VictoryAxis
					crossAxis
					label={
						!isEmpty(chartData) && chartData[0].looping
							? s.ekos.collapse_align.xAxis
							: s.ekos.collapse_focus.steps
					}
					axisLabelComponent={
						<VictoryLabel
							style={{ fill: "white", fontSize: "15px", fontWeight: "bold" }}
							dy={15}
						/>
					}
					fixLabelOverlap={true}
					tickFormat={(t) =>
						t > 1000 ? `${Math.round(t / 1000).toFixed(1)}k` : t
					}
					style={{
						grid: { stroke: Palette.white30 },
					}}
				/>
			</VictoryChart>
		</Box>
	);
};

export default Graph;
