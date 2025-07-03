import React, { useState, useEffect } from "react";
import { useTheme } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import axios from "axios";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Gets timezone information from Google's Timezone API
 * 
 * @param {number} lat - Latitude coordinate
 * @param {number} lng - Longitude coordinate
 * @returns {Promise<Array|null>} - Array with [timezoneId, dstOffset, rawOffset] or null on error
 */
const getTimezoneFromGoogle = async (lat, lng) => {
  try {
    // Current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000);
    // Make a request to Google's Time Zone API
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/timezone/json',
      {
        params: {
          location: `${lat},${lng}`,
          timestamp: timestamp,
          key: process.env.REACT_APP_GOOGLE_MAPS_KEY
        }
      }
    );
    
    // Check if the request was successful
    if (response.data.status === 'OK') {
      return [response.data.timeZoneId, response.data.dstOffset, response.data.rawOffset];
    } else {
      console.error('Error from Google Time Zone API:', response.data.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching timezone from Google API:', error);
    return null;
  }
};

/**
 * Approximates timezone offset from longitude
 * Each 15 degrees of longitude corresponds to approximately 1 hour
 * 
 * @param {number} lng - Longitude coordinate
 * @returns {number} - Approximate timezone offset in hours
 */
const getTimezoneOffsetFromLongitude = (lng) => {
  // Convert longitude to hours: 15 degrees = 1 hour
  const hours = Math.round(lng / 15);
  return hours;
};

/**
 * Gets timezone name based on offset
 * 
 * @param {number} offset - Timezone offset in hours
 * @returns {string} - Timezone name
 */
const getTimezoneName = (offset) => {
  if (offset === 0) return "UTC";
  const sign = offset > 0 ? "+" : "";
  return `UTC${sign}${offset}`;
};

/**
 * Component that displays the current time based on observatory location
 */
const ObservatoryTimeClock = ({ location }) => {
  const { palette } = useTheme();
  const [currentTime, setCurrentTime] = useState(null);
  const [timezoneName, setTimezoneName] = useState("UTC");
  const [timezoneOffset, setTimezoneOffset] = useState(0);
  const [timezoneDisplayName, setTimezoneDisplayName] = useState("UTC");

  useEffect(() => {
    // Determine timezone from location using Google API
    const fetchTimezone = async () => {
      if (location && location.lat !== undefined && location.lng !== undefined) {
        const timezoneData = await getTimezoneFromGoogle(location.lat, location.lng);
        
        if (timezoneData) {
          const [tzId, dstOffset, rawOffset] = timezoneData;
          // Total offset in minutes
          const totalOffsetMinutes = (rawOffset + dstOffset) / 60;
          setTimezoneOffset(totalOffsetMinutes);
          setTimezoneName(tzId);
          
          // Create UTC+/- format for display
          const totalOffsetHours = totalOffsetMinutes / 60;
          const formattedOffset = formatTimezoneOffset(totalOffsetHours);
          setTimezoneDisplayName(formattedOffset);
        } else {
          // Fallback to approximation if API fails
          const offset = getTimezoneOffsetFromLongitude(location.lng);
          setTimezoneOffset(offset * 60); // Convert hours to minutes
          setTimezoneName(getTimezoneName(offset));
          setTimezoneDisplayName(getTimezoneName(offset));
        }
      } else {
        // Default to UTC if no location
        setTimezoneOffset(0);
        setTimezoneName("UTC");
        setTimezoneDisplayName("UTC");
      }
    };
    
    fetchTimezone();
  }, [location]);

  useEffect(() => {
    // Update time every second
    const updateTime = () => {
      let time;
      if (location && (location.lat !== undefined || location.lng !== undefined)) {
        // Apply the timezone offset (in minutes)
        time = dayjs().utcOffset(timezoneOffset);
      } else {
        // Use UTC if no location
        time = dayjs().utc();
      }
      setCurrentTime(time);
    };

    // Initial update
    updateTime();

    // Set interval for updates
    const intervalId = setInterval(updateTime, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [location, timezoneOffset]);

  // Format timezone offset to UTC+/- format
  const formatTimezoneOffset = (offsetHours) => {
    if (offsetHours === 0) return "UTC";
    
    // Round to the nearest quarter hour
    const roundedOffset = Math.round(offsetHours * 4) / 4;
    
    // Format as UTC+X or UTC-X
    const sign = roundedOffset > 0 ? "+" : "-";
    const absOffset = Math.abs(roundedOffset);
    
    // Handle fractional hours (15, 30, 45 minutes)
    if (Number.isInteger(absOffset)) {
      return `UTC${sign}${absOffset}`;
    } else {
      const hours = Math.floor(absOffset);
      const minutes = Math.round((absOffset - hours) * 60);
      return `UTC${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
    }
  };

  if (!currentTime) return null;

  return (
    <Box>
      <Typography
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" component="span" fontSize="1rem">
          Observatory Time
        </Typography>
        <Typography
          variant="subtitle1"
          fontSize="1rem"
          component="span"
          sx={{ color: palette.grey.main }}
        >
          {currentTime.format("HH:mm")}
        </Typography>
      </Typography>
      <Typography
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" component="span" fontSize="1rem">
          Timezone
        </Typography>
        <Typography
          variant="subtitle1"
          fontSize="1rem"
          component="span"
          sx={{ color: palette.grey.main }}
        >
          {timezoneDisplayName}
        </Typography>
      </Typography>
      <Typography
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" component="span" fontSize="1rem">
          Date
        </Typography>
        <Typography
          variant="subtitle1"
          fontSize="1rem"
          component="span"
          sx={{ color: palette.grey.main }}
        >
          {currentTime.format("YYYY-MM-DD")}
        </Typography>
      </Typography>
    </Box>
  );
};

export default ObservatoryTimeClock;
