import React from "react";

const TripodIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* Triangle body of tripod */}
      <line x1="12" y1="4" x2="5" y2="20" />
      <line x1="12" y1="4" x2="19" y2="20" />
      <line x1="5" y1="20" x2="19" y2="20" />
      
      {/* Cross bars */}
      <line x1="8.5" y1="14" x2="15.5" y2="14" />
      
      {/* Mount point */}
      <circle cx="12" cy="4" r="2" />
    </svg>
  );
};

export default TripodIcon; 