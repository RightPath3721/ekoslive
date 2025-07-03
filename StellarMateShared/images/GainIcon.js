import React, { Component } from "react";
import { View } from "react-native";
import Svg, { Defs, Path, Text, TSpan } from "react-native-svg";
import { Palette } from "../shared/common/styles";

const SvgComponent = (props) => (
	<Svg
		xmlns="http://www.w3.org/2000/svg"
		id="prefix__svg7"
		viewBox="0 0 22 22"
		{...props}
	>
		<Defs id="prefix__defs3"></Defs>
		<Path
			id="prefix__path5"
			d="M4 3v14H3v1h1v1h1v-1h14v-1H5v-2h2.707l2.5-2.5-.707-.707L7.293 14H5V3H4zm13.5.793L14.793 6.5l.707.707L18.207 4.5l-.707-.707zm-4 4L10.793 10.5l.707.707L14.207 8.5l-.707-.707z"
			fill={props.color}
		/>
		<Text
			id="prefix__text838"
			y={8.994}
			x={5.24}
			style={{
				lineHeight: "125%",
			}}
			xmlSpace="preserve"
			fontStyle="normal"
			fontWeight={400}
			fontSize={40}
			fontFamily="Roboto"
			letterSpacing={0}
			wordSpacing={0}
			fill={props.color}
			fillOpacity={1}
			stroke="none"
			strokeWidth={1}
			strokeLinecap="butt"
			strokeLinejoin="miter"
			strokeOpacity={1}
		>
			<TSpan
				y={8.994}
				x={5.24}
				id="prefix__tspan836"
				fontSize={10.667}
				fill={props.color}
				fillOpacity={1}
			>
				{"e"}
			</TSpan>
		</Text>
		<Path
			id="prefix__rect856"
			opacity={0.98}
			fill={Palette.orange}
			fillOpacity={1}
			fill={Palette.orange}
			strokeWidth={0}
			strokeMiterlimit={4}
			strokeDasharray="none"
			d="M10.467 3.117h1.914v.74h-1.914z"
		/>
	</Svg>
);

class GainIcon extends Component
{
	render()
	{
		const { style } = this.props;
		const component = SvgComponent(style);

		return <View style={style}>{component}</View>;
	}
}

export default GainIcon;
