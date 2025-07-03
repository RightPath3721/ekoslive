import React from "react";

const EquipmentFilterIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
{
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="9" cy="9" r="7" />
            <circle cx="15" cy="15" r="7" />
        </svg>
    );
};

export default EquipmentFilterIcon;
