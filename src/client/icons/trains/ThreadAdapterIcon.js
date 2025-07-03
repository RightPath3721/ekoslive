import React from "react";

const ThreadAdapterIcon = ({ width = 25, height = 25, color = "#CECECE" }) =>
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
      {/* T-adapter body - more realistic with stepped design */}
      <path d="M8 7 C8 7 7 7 7 8 L7 10 C7 11 8 11 8 11 L16 11 C16 11 17 11 17 10 L17 8 C17 7 16 7 16 7 Z" />
      
      {/* Thread adapter middle section */}
      <path d="M9 11 L15 11 L15 14 L9 14 Z" />
      
      {/* Filter thread section */}
      <circle cx="12" cy="16" r="2.5" />
      <circle cx="12" cy="16" r="1.5" />
      
      {/* Thread patterns on the inside */}
      <path d="M11.25 14.5 L12.75 17.5" strokeWidth="0.5" />
      <path d="M12.75 14.5 L11.25 17.5" strokeWidth="0.5" />
      
      {/* Knurled grip texture */}
      <line x1="8" y1="8.5" x2="16" y2="8.5" strokeWidth="0.5" />
      <line x1="8" y1="9.5" x2="16" y2="9.5" strokeWidth="0.5" />
      
      {/* Optical path */}
      <line x1="12" y1="7" x2="12" y2="16" strokeDasharray="1 1" strokeWidth="1" />
    </svg>
  );
};

export default ThreadAdapterIcon; 