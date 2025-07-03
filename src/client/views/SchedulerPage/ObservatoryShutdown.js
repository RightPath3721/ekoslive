import { Button, Checkbox, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { get } from "lodash";
import Image from "mui-image";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ekosActions, schedulerActions } from "@redux/actions";
import { selectSchedulerSettings } from "@redux/selectors";
import { styles } from "../../shared/styles";
import s from "@common/shared/i18n/i18n";

const Settings =
{
    schedulerWarmCCD: "schedulerWarmCCD",
    schedulerCloseDustCover: "schedulerCloseDustCover",
    schedulerParkMount: "schedulerParkMount",
    schedulerParkDome: "schedulerParkDome",
    schedulerShutdownScript: "schedulerShutdownScript",
};

const SchedulerCheckbox = ({ checked, onChange, title }) =>
{
    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: "10px" }}>
            <Checkbox style={{ color: "white", padding: 0 }} checked={checked} onChange={onChange} />
            <Typography sx={[styles.text, { width: "max-content" }]}>
                {title}
            </Typography>
        </Box>
    )
};

const ObservatoryShutdown = () =>
{
    const dispatch = useDispatch();
    const schedulerSettings = useSelector(selectSchedulerSettings);

    const [constraints, setConstraints] = useState({
        schedulerWarmCCD: false,
        schedulerCloseDustCover: false,
        schedulerParkMount: false,
        schedulerParkDome: false,
    });
    const {
        schedulerWarmCCD,
        schedulerCloseDustCover,
        schedulerParkDome,
        schedulerParkMount,
    } = constraints;

    useEffect(() =>
    {
        setConstraints({
            ...constraints,
            schedulerWarmCCD: get(schedulerSettings, Settings.schedulerWarmCCD, false),
            schedulerCloseDustCover: get(schedulerSettings, Settings.schedulerCloseDustCover, false),
            schedulerParkMount: get(schedulerSettings, Settings.schedulerParkMount, false),
            schedulerParkDome: get(schedulerSettings, Settings.schedulerParkDome, false),
        });
    }, [])

    const setSettings = (key, value) =>
    {
        dispatch(schedulerActions.setAllSettings({ [key]: value }));
    };

    return (<>
        <SchedulerCheckbox
            title={s.ekos.scheduler.warmCCD}
            checked={schedulerWarmCCD}
            onChange={(event) =>
            {
                setConstraints({
                    ...constraints,
                    schedulerWarmCCD: event.target.checked,
                });
                setSettings(Settings.schedulerWarmCCD, event.target.checked);
            }}
        />
        <SchedulerCheckbox
            title={s.ekos.collapse_dome.cap}
            checked={schedulerCloseDustCover}
            onChange={(event) =>
            {
                setConstraints({
                    ...constraints,
                    schedulerCloseDustCover: event.target.checked,
                });
                setSettings(Settings.schedulerCloseDustCover, event.target.checked);
            }}
        />
        <SchedulerCheckbox
            title={s.ekos.capture_auto_calibration.park_mount}
            checked={schedulerParkMount}
            onChange={(event) =>
            {
                setConstraints({
                    ...constraints,
                    schedulerParkMount: event.target.checked,
                });
                setSettings(Settings.schedulerParkMount, event.target.checked);
            }}
        />
        <SchedulerCheckbox
            title={s.ekos.capture_auto_calibration.park_dome}
            checked={schedulerParkDome}
            onChange={(event) =>
            {
                setConstraints({
                    ...constraints,
                    schedulerParkDome: event.target.checked
                });
                setSettings(Settings.schedulerParkDome, event.target.checked);
            }}
        />
        <Button
            onClick={() => dispatch(ekosActions.invokeMethod("Scheduler", "runShutdownProcedure"))}
        >
            <Image
                src="/public/icons/play-qc.png"
                width={35}
                height={35}
                duration={0}
            />
        </Button>
    </>
    )
}

export default ObservatoryShutdown;