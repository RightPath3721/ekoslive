import React from "react";

const CounterweightSystemIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* Mount attachment point */}
      <circle cx="12" cy="5" r="1.5" />
      
      {/* Counterweight bar */}
      <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5" />
      
      {/* Main counterweight - more disc-like shape */}
      <ellipse cx="12" cy="12" rx="4" ry="2" />
      <line x1="12" y1="10" x2="12" y2="14" />
      
      {/* Secondary counterweight */}
      <ellipse cx="12" cy="16" rx="3.5" ry="1.75" />
      <line x1="12" y1="14.25" x2="12" y2="17.75" />
      
      {/* Safety cap */}
      <path d="M10 19 L14 19 L14 20 L10 20 Z" />
    </svg>
  );
};

export default CounterweightSystemIcon; 