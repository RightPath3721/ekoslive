import React from 'react'

const DomeShutterDirectionIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
{
    return (
        <svg viewBox="0 0 160 160" height={height} width={width} fill={color} xmlns="http://www.w3.org/2000/svg">
            <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <circle stroke="#FFFFFF" strokeWidth="2" cx="80.5" cy="81.5" r="62.5" />
                <circle stroke="#FFFFFF" cx="80.5" cy="81.5" r="48.5" />
                <path d="M74.0038683,33.2220925 L70.1539489,20.3918819 C74.8035655,19.5553725 78.382772,19.1371178 80.8915685,19.1371178 C83.400365,19.1371178 86.9795715,19.5553725 91.6291881,20.3918819 L88.8140375,33.2220925 C85.1872604,33.2220925 82.5464374,33.2220925 80.8915685,33.2220925 C79.2366996,33.2220925 76.9407996,33.2220925 74.0038683,33.2220925 Z" fill="#FFFFFF" />
            </g>
        </svg>
    )
};

export default DomeShutterDirectionIcon