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
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import { Box } from "@mui/material";

const Graph = ({ chartData }) =>
{
	return (
		<Box sx={{ height: "250px", width: "300px" }}>
			<VictoryChart theme={VictoryTheme.material}>
				<VictoryLine
					style={{
						data: { stroke: "#c43a31" },
						parent: { border: "1px solid #ccc" },
					}}
					interpolation="cardinal"
					data={chartData}
				/>
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
								fill: Palette.white70,
								fontSize: "20px",
								fontWeight: "bold",
							}}
						/>
					}
					data={chartData}
				/>
				<VictoryAxis
					dependentAxis
					label="Errors (arcsec)"
					axisLabelComponent={
						<VictoryLabel
							style={{ fill: "white", fontSize: "15px", fontWeight: "bold" }}
							dy={-30}
						/>
					}
				/>
				<VictoryAxis
					crossAxis
					label={
						!isEmpty(chartData) && chartData[0].looping
							? s.ekos.collapse_align.x_axis
							: s.ekos.collapse_align.x_axis
					}
					axisLabelComponent={
						<VictoryLabel
							style={{ fill: "white", fontSize: "15px", fontWeight: "bold" }}
							dy={15}
						/>
					}
					fixLabelOverlap={true}
					tickFormat={(t) => `${Math.round(t)}`}
					style={{
						grid: { stroke: Palette.white30 },
					}}
				/>
			</VictoryChart>
		</Box>
	);
};

export default Graph;
