import React, {Component} from "react";
import {View} from 'react-native';
import Svg, {Circle, Ellipse, G, Path} from 'react-native-svg';

const SvgComponent = (props) => (
    <Svg xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 85.242 85.702"
         height={35}
         width={35}
         {...props}>
        <G
            transform="translate(-106.86 -150.912)"
            stroke="#fff"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <Path
                transform="matrix(.77452 0 0 .66091 26.434 53.153)"
                d="M187.854 169.622l-6.492-3.514-6.575 3.357 1.335-7.26-5.224-5.217 7.318-.973 3.346-6.58 3.187 6.658 7.293 1.15-5.348 5.089z"
                fill="#fff"
                strokeWidth={0.529}
            />
            <Ellipse ry={25.58} rx={25.015} cy={176.992} cx={149.481} fill="none"/>
            <Circle
                r={3.969}
                cy={176.992}
                cx={149.481}
                fill="#fff"
                strokeWidth={0.529}
            />
            <Path
                fill="#356038"
                strokeWidth={0.295}
                d="M107.008 207.133h84.948v29.334h-84.948z"
            />
        </G>
    </Svg>
);

// function SvgComponent(props, color) {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 85.242 85.702"
//       height={323.913}
//       width={322.175}
//       {...props}
//     >
//       <g
//         transform="translate(-106.86 -150.912)"
//         stroke="#fff"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       >
//         <path
//           transform="matrix(.77452 0 0 .66091 26.434 53.153)"
//           d="M187.854 169.622l-6.492-3.514-6.575 3.357 1.335-7.26-5.224-5.217 7.318-.973 3.346-6.58 3.187 6.658 7.293 1.15-5.348 5.089z"
//           fill="#fff"
//           strokeWidth={0.529}
//         />
//         <ellipse ry={25.58} rx={25.015} cy={176.992} cx={149.481} fill="none" />
//         <circle
//           r={3.969}
//           cy={176.992}
//           cx={149.481}
//           fill="#fff"
//           strokeWidth={0.529}
//         />
//         <path
//           fill="#356038"
//           strokeWidth={0.295}
//           d="M107.008 207.133h84.948v29.334h-84.948z"
//         />
//       </g>
//     </svg>
//   )
// }

class Circumpolar extends Component
{
    render()
    {
        const {style, color} = this.props;
        const component = SvgComponent(style);


        return <View style={style}>{component}</View>;
    }
}

export default Circumpolar;
