import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Box, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material";

/**
 * Formats bytes to a human-readable format (KB, MB, GB, etc.)
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - The number of decimal places to show
 * @returns {string} - Formatted string with appropriate unit
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

/**
 * Component to display cloud storage usage with a circular progress bar
 * @param {Object} props - Component props
 * @param {number} props.usage - Current usage in bytes
 * @param {number} props.limit - Maximum limit in bytes
 * @returns {JSX.Element} - Rendered component
 */
const CloudStorageUsage = ({ usage, limit }) => {
  const { palette } = useTheme();
  
  // Calculate percentage
  const percentage = Math.min(Math.round((usage / limit) * 100), 100);
  
  // Determine color based on usage percentage
  const getColor = () => {
    if (percentage >= 100) return palette.error.main; // Red for 100%
    if (percentage >= 90) return palette.warning.main; // Yellow/Orange for 90-99%
    return palette.success.main; // Green for 0-89%
  };

  // Determine if warning should be shown (at 90% or more)
  const showWarning = percentage >= 90;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Tooltip 
        title={`${formatBytes(usage)} of ${formatBytes(limit)} used`} 
        arrow
      >
        <Box sx={{ width: 80, height: 80 }}>
          <CircularProgressbar
            value={percentage}
            text={`${percentage}%`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: getColor(),
              textColor: palette.white[900],
              trailColor: palette.grey[300],
            })}
          />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default CloudStorageUsage;
