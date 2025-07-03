import React, {Component} from 'react';
import {View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

const SvgComponent = (props, color) => (
    <Svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 22 22"
         {...props}>
        <Path
            d="M11 3a7 6 0 00-.92.059 7 6 0 00-.162.017l-.004.004A7 6 0 004 9a7 3 0 00.012.094A7 2 0 014 9v8a7 2 0 007 2 7 2 0 007-2V9a7 6 0 00-4.316-5.535c0-.001 0-.003.002-.004a7 6 0 00-.055-.018 7 6 0 00-.39-.119 7 6 0 00-.282-.08 7 6 0 00-.38-.082 7 6 0 00-.304-.058 7 6 0 00-.37-.045 7 6 0 00-.329-.036A7 6 0 0011 3zm2.115 1.326A6 5 0 0117 9a6 2 0 01-6 2 6 2 0 01-6-2 6 5 0 013.752-4.633C7.728 5.853 7.191 7.794 7.041 9.5A6 2 0 0011 10c.299-2.495 1.193-4.245 2.115-5.674zM5 10.537A7 3 0 0011 12a7 3 0 006-1.46V17a6 1 0 01-6 1 6 1 0 01-6-1v-6.463z"
            fill={color}
        />
    </Svg>
);

class EkosIcon extends Component
{
    render()
    {
        const {style, color} = this.props;
        const component = SvgComponent(style, color);

        return <View style={style} color={this.props.color}>{component}</View>;
    }
}

export default EkosIcon;
