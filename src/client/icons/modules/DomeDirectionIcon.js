import React from 'react'

const DomeDirectionIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
{
    return (
        <svg viewBox="0 0 160 160" height={height} width={width} fill={color} xmlns="http://www.w3.org/2000/svg">
            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <path d="M81.25,19.5 L81.25,145.5" stroke="#FFFFFF" strokeLinecap="square" />
                <path d="M144.05,82.7 L18.05,82.7" stroke="#FFFFFF" strokeLinecap="square" />
                <text fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                    <tspan x="0" y="85">W</tspan>
                </text>
                <text fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                    <tspan x="148" y="85">E</tspan>
                </text>
                <text fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                    <tspan x="77" y="11">N</tspan>
                </text>
                <text fontFamily="Roboto" fontSize="12" fontWeight="bold" fill="#FFFFFF">
                    <tspan x="77" y="158">S</tspan>
                </text>
            </g>
        </svg>
    )
};

export default DomeDirectionIcon