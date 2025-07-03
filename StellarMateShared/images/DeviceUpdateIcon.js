import React, {Component} from "react";
import {View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

const SvgComponent = (props, color) => (
    <Svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 48 40"
         {...props}>
        <Path
            d="M32 34.02V20h-4v14.02h-6L30 42l8-7.98h-6zM18 6l-8 7.98h6V28h4V13.98h6L18 6z"
            fill={color}
        />
        <Path
            d="M43.85.991L35.472.983c-.926 0-1.675.75-1.675 1.676v15.08c0 .925.75 1.675 1.675 1.675h8.378c.926 0 1.675-.75 1.675-1.676V2.658c0-.925-.75-1.667-1.675-1.667zm0 15.072h-8.378V4.334h8.378zm-.838-5.027H40.5V6.847h-1.676v4.19H36.31l3.351 3.35z"
            fill="#f60"
        />
    </Svg>
);

class DeviceUpdateIcon extends Component
{
    render()
    {
        const {style, color} = this.props;
        const component = SvgComponent(style, color);


        return <View style={style} color={this.props.color}>{component}</View>;
    }
}

export default DeviceUpdateIcon;
