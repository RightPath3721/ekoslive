import React from "react";

const PierIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* Pier column */}
      <path d="M10 4 L10 20 L14 20 L14 4 Z" />
      
      {/* Top plate */}
      <line x1="8" y1="4" x2="16" y2="4" />
      
      {/* Base plate */}
      <line x1="6" y1="20" x2="18" y2="20" />
      
      {/* Mounting bolts */}
      <circle cx="9" cy="5" r="0.5" />
      <circle cx="15" cy="5" r="0.5" />
    </svg>
  );
};

export default PierIcon; 