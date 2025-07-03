import React from "react";

const ObservatoryControllerIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* Dome */}
      <path d="M12 4 a8 8 0 0 1 8 8 l-16 0 a8 8 0 0 1 8 -8 z" />
      
      {/* Dome slit */}
      <path d="M12 4 L12 12" />
      
      {/* Controller box */}
      <rect x="7" y="14" width="10" height="6" rx="1" />
      
      {/* Display/buttons */}
      <line x1="9" y1="17" x2="11" y2="17" />
      <circle cx="14" cy="17" r="1" />
      
      {/* Connection lines */}
      <line x1="4" y1="12" x2="4" y2="16" />
      <line x1="20" y1="12" x2="20" y2="16" />
    </svg>
  );
};

export default ObservatoryControllerIcon; 