import { get, isEmpty, isEqual } from "lodash";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	VictoryAxis,
	VictoryChart,
	VictoryLabel,
	VictoryLine,
	VictoryTheme,
} from "victory";
import { Palette } from "@common/shared/common/styles";
import { selectGuideStatus } from "@redux/selectors";
import { setupActions } from "@redux/actions";
import s from "@common/shared/i18n/i18n";
import { Box } from "@mui/material";

const Graph = () =>
{
	const dispatch = useDispatch();

	const connected = useSelector(
		(state) => state.ekos.connection.connected && state.ekos.connection.online,
	);
	const guideStatus = useSelector(selectGuideStatus, isEqual);
	const chartData = get(guideStatus, "chart.data", []);

	const resetChart = () =>
	{
		const payload = {
			ra: [],
			de: [],
			rms: [],
			data: [],
			limit: 0,
		};

		dispatch(setupActions.setStatusParameterValue("chart", payload));
	};

	useEffect(() =>
	{
		if (!connected) resetChart();
	}, [connected]);

	return (
		<Box sx={{ height: "216px", width: "450px" }}>
			<VictoryChart
				padding={{ right: 0 }}
				width={600}
				theme={VictoryTheme.material}
			>
				<VictoryLine
					interpolation="basis"
					style={{
						data: { stroke: "#292" },
					}}
					data={
						isEmpty(chartData)
							? []
							: chartData.map((info) => ({
									x: info.pos,
									y: info.ra,
								}))
					}
				/>
				<VictoryLine
					interpolation="basis"
					style={{
						data: { stroke: "#0cf" },
					}}
					data={
						isEmpty(chartData)
							? []
							: chartData.map((info) => ({
									x: info.pos,
									y: info.de,
								}))
					}
				/>
				<VictoryLine
					interpolation="basis"
					style={{
						data: { stroke: "#f00" },
					}}
					data={
						isEmpty(chartData)
							? []
							: chartData.map((info) => ({
									x: info.pos,
									y: info.rms,
								}))
					}
				/>
				<VictoryAxis
					dependentAxis
					label={s.ekos.collapse_guide.yAxis}
					axisLabelComponent={
						<VictoryLabel
							style={{
								fill: Palette.white70,
								fontSize: "15px",
								fontWeight: "bold",
							}}
							dy={-40}
						/>
					}
					tickFormat={(t) => t.toFixed(3)}
					tickCount={6}
					style={{
						grid: { stroke: Palette.white30 },
					}}
					animate={{
						duration: 200,
						easing: "bounce",
					}}
				/>
			</VictoryChart>
		</Box>
	);
};

export default Graph;
