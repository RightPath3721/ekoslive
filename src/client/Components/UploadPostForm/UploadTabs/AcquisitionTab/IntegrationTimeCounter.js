import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useAcquisitionContext } from "./AcquisitionTabContext";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";

dayjs.extend(duration);

const IntegrationTimeCounter = () =>
{
    const { filters } = useAcquisitionContext();
    const [integrationTime, setIntegrationTime] = useState(0);

    useEffect(() =>
    {
        const hours = dayjs
            .duration(
                filters.reduce((acc, filter) =>
                {
                    return acc + filter.frames * filter.duration;
                }, 0),
                "seconds"
            )
            .asHours()
            .toFixed(2);
        setIntegrationTime(hours);
    }, [filters]);

    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                flexDirection: "column",
                gap: ".25rem",
            }}
        >
            <Typography variant="body1">Integration Time</Typography>
            <Typography
                sx={{
                    backgroundColor: Palette.grey99,
                    borderRadius: ".5rem",
                    padding: ".25rem .5rem",
                    color: Palette.grey11,
                }}
                component="span"
            >
                {integrationTime}&nbsp;{s.general.hours}
            </Typography>
        </Box>
    );
};

export default IntegrationTimeCounter;
