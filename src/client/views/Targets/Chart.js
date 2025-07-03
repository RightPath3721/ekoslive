import React, { memo } from "react";
import { isEmpty } from "lodash";
import { Palette } from "@common/shared/common/styles";
import {
	VictoryAxis,
	VictoryChart,
	VictoryLabel,
	VictoryLine,
	VictoryTheme,
} from "victory";

const xAxisLabel = ["12:00", "18:00", "00:00", "06:00", "12:00"];
const horizontalMargin = 8;

const Chart = ({ altitudes, datetime, observability, width, height }) =>
{
	if (isEmpty(observability)) return null;

	const maxAltitude = Math.max(...altitudes.map((a) => Math.abs(a)));

	const currentMinutes = Number.parseFloat(
		(datetime.getMinutes() / 60).toFixed(2),
	);
	const currentHours = datetime.getHours() + currentMinutes;

	return (
		<VictoryChart
			padding={{
				left: (width * horizontalMargin) / 100,
				right: (width * horizontalMargin) / 100,
			}}
			theme={VictoryTheme.material}
			style={{ border: "1px solid orange" }}
			width={width}
			height={height}
		>
			<VictoryLine
				interpolation="cardinal"
				style={{
					data: { stroke: Palette.white70, strokeWidth: 1 },
				}}
				data={altitudes}
			/>
			<VictoryLine
				style={{
					data: { stroke: Palette.orange, strokeWidth: 2 },
				}}
				data={[
					{
						x:
							currentHours <= 12
								? currentHours * 2 + 24
								: (currentHours - 12) * 2,
						y: 0,
					},
					{
						x:
							currentHours <= 12
								? currentHours * 2 + 24
								: (currentHours - 12) * 2,
						y: 100,
					},
				]}
				labels={() => [
					"AZ: +" +
						observability.az.toFixed(0).toString().padStart(3, "0") +
						"°",
					`AL: ${observability.alt >= 0 ? "+" : "-"}` +
						Math.abs(observability.alt).toFixed(0).toString().padStart(3, "0") +
						"°",
				]}
				labelComponent={
					<VictoryLabel
						dx={currentHours < 18 ? 50 : -50}
						backgroundStyle={{ fill: "rgba(0,0,0,0)" }}
						backgroundPadding={3}
						style={{
							fontSize: "18px",
							fill: Palette.orange,
							fontWeight: "bold",
						}}
					/>
				}
			/>
			<VictoryAxis
				domain={[maxAltitude * -1, maxAltitude]}
				dependentAxis
				style={{
					grid: { stroke: "#99999950" },
					tickLabels: { fill: Palette.white70, fontSize: "12px" },
				}}
				tickCount={6}
				axisLabelComponent={
					<VictoryLabel
						style={{
							fill: Palette.white70,
							fontSize: "14px",
							fontWeight: "bold",
						}}
					/>
				}
				tickFormat={(t) => t.toFixed()}
			/>
			<VictoryAxis
				crossAxis
				style={{
					grid: { stroke: "transparent" },
					tickLabels: { fill: Palette.white70, fontSize: "12px" },
				}}
				axisLabelComponent={
					<VictoryLabel
						style={{
							fill: Palette.white70,
							fontSize: "15px",
							fontWeight: "bold",
						}}
					/>
				}
				tickValues={[0, 12, 24, 36, 48]}
				tickFormat={(_, index) => xAxisLabel[index]}
			/>
		</VictoryChart>
	);
};

export default memo(Chart);
