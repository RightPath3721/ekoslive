import React from "react";

const VisualBackIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* Telescope adapter section */}
      <path d="M7 7 L17 7 L17 10 L7 10 Z" />
      
      {/* Visual back body with slight taper */}
      <path d="M8 10 L16 10 L15 15 L9 15 Z" />
      
      {/* Eyepiece/camera attachment ring */}
      <circle cx="12" cy="15" r="3" />
      
      {/* Internal optical opening */}
      <circle cx="12" cy="15" r="1.5" />
      
      {/* Thumbscrews for locking */}
      <circle cx="7.5" cy="12" r="0.75" fill={color} />
      <circle cx="16.5" cy="12" r="0.75" fill={color} />
      
      {/* Optical path indicator */}
      <line x1="12" y1="7" x2="12" y2="15" strokeDasharray="1 1" strokeWidth="1" />
    </svg>
  );
};

export default VisualBackIcon; 