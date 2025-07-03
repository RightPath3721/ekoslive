import React from "react";

const ExtensionTubeIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* Outer cylinder */}
      <rect x="8" y="6" width="8" height="12" rx="1" />
      
      {/* Inner tube details */}
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="15" x2="16" y2="15" />
      
      {/* Connection points */}
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  );
};

export default ExtensionTubeIcon; 