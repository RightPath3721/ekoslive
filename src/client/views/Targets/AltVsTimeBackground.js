import React from "react";
import Box from "@mui/material/Box";

// takes time and returns fraction of the starting point from 12pm to 12pm (24 hrs) so something at 12 am returns 0.5
const findStartingPointFraction = (timeInSeconds) =>
{
    let secondsIn24Hrs = 86400;
    let shift12Hours = 43200;

    // shifts the time so 12 am is the mid point in 24 hours
    if (timeInSeconds <= 43200)
        return (timeInSeconds + shift12Hours) / secondsIn24Hrs;
    else
        return (timeInSeconds - shift12Hours) / secondsIn24Hrs
}

const AltVsTimeBackground = ({ almanac, width, height }) =>
{
    // returns the widths for background based on Almanac
    const findwidths = () =>
    {
        let widths = {};
        if (almanac === undefined)
            return widths;

        else
        {
            const { Dusk, Dawn, SunRise, SunSet } = almanac;

            // finding the width of each section from zero to the specific section
            let sunset = findStartingPointFraction(SunSet * 24 * 60 * 60) * width;
            let dusk = findStartingPointFraction((Dusk < 0 ? (1 + Dusk) : Dusk) * (24 * 60 * 60)) * width;
            let dawn = findStartingPointFraction((Dawn < 0 ? (1 + Dawn) : Dawn) * (24 * 60 * 60)) * width;
            let sunrise = findStartingPointFraction(SunRise * 24 * 60 * 60) * width;

            // finding the width for each section by accounting for it's position and previous sections
            widths.sunset = sunset;
            widths.dusk = dusk - sunset;
            if (width.dusk < 0)
                width.dusk = sunset;
            widths.visibleRange = dawn - dusk;
            widths.dawn = sunrise - dawn;
            if (width.dawn < 0)
                widths.dawn = sunrise;
            widths.sunrise = width - sunrise;
            return widths;
        }
    }

    const widths = findwidths();

    return (
        <Box sx={{ display: "flex", flex: 1, flexDirection: "column", width: width, height: height }}>
            <Box sx={[{
                width: width,
                display: "flex",
                flexDirection: "row",
            }]}>
                <Box sx={{
                    height: height / 2,
                    width: "33%",
                    backgroundColor: "#438491",
                    zIndex: 2
                }} />

                <Box
                    sx={{
                        height: height / 2,
                        width: "10%",
                        zIndex: 2,
                        background: 'linear-gradient(to right, #909090, #000000)',
                    }}
                >
                    <Box sx={{ background: 'linear-gradient(90deg, #909090, #000000)', height: height / 2 }}>
                        <Box sx={{ height: height, width: widths.dusk, zIndex: 2, elevation: 2 }} />
                    </Box>
                </Box>

                <Box sx={{
                    height: height / 2,
                    width: "33%",
                    backgroundColor: "#181818",
                    zIndex: 2,
                    elevation: 2
                }} />

                <Box style={{ height: height / 2, width: "10%", zIndex: 2, elevation: 2, background: "linear-gradient(to right, #909090, #000000)", }}>
                    <Box sx={{ background: 'linear-gradient(90deg, #000000, #909090)', height: height / 2 }}>
                        <Box sx={{ height: height / 2, width: "10%", zIndex: 2, elevation: 2 }} />
                    </Box>
                        </Box>

                <Box style={{
                    height: height / 2,
                    width: "33%",
                    backgroundColor: "#438491",
                    zIndex: 2,
                    elevation: 2
                }} />
            </Box>

            <Box sx={{
                height: height / 2,
                width: width,
                backgroundColor: "#356038",
            }} />
        </Box>)

}

export default AltVsTimeBackground;
