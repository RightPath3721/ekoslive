import React, { useEffect, useState } from "react";
import { Button, Checkbox, Typography, Box } from "@mui/material";
import { get } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { ekosActions, schedulerActions } from "@redux/actions";
import { selectSchedulerSettings } from "@redux/selectors";
import { styles } from "../../shared/styles";
import s from "@common/shared/i18n/i18n";

const Settings =
{
    schedulerUnparkDome: "schedulerUnparkDome",
    schedulerUnparkMount: "schedulerUnparkMount",
    schedulerOpenDustCover: "schedulerOpenDustCover",
    schedulerStartupScript: "schedulerStartupScript"
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

const ObservatoryStartup = () => 
{
    const dispatch = useDispatch();
    const schedulerSettings = useSelector(selectSchedulerSettings);

    const [constraints, setConstraints] = useState({
        schedulerUnparkDome: false,
        schedulerUnparkMount: false,
        schedulerOpenDustCover: false,
    });
    const { schedulerUnparkDome, schedulerUnparkMount, schedulerOpenDustCover } = constraints;

    useEffect(() =>
    {
        setConstraints({
            ...constraints,
            schedulerUnparkDome: get(schedulerSettings, Settings.schedulerUnparkDome, false),
            schedulerUnparkMount: get(schedulerSettings, Settings.schedulerUnparkMount, false),
            schedulerOpenDustCover: get(schedulerSettings, Settings.schedulerOpenDustCover, false),
        })
    }, []);

    const setSettings = (key, value) => 
    {
        dispatch(schedulerActions.setAllSettings({ [key]: value }));
    };

    return (
        <>
            <SchedulerCheckbox title={s.ekos.scheduler.unparkDome}
                checked={schedulerUnparkDome}
                onChange={(event) =>
                {
                    setConstraints({
                        ...constraints,
                        schedulerUnparkDome: !schedulerUnparkDome
                    });
                    setSettings(Settings.schedulerUnparkDome, event.target.checked)
                }}
            />
            <SchedulerCheckbox title={s.ekos.scheduler.unparkMount}
                checked={schedulerUnparkMount}
                onChange={(event) =>
                {
                    setConstraints({
                        ...constraints,
                        schedulerUnparkMount: !schedulerUnparkMount
                    });
                    setSettings(Settings.schedulerUnparkMount, event.target.checked);
                }}
            />
            <SchedulerCheckbox title={s.ekos.scheduler.uncap}
                checked={schedulerOpenDustCover}
                onChange={(event) =>
                {
                    setConstraints({
                        ...constraints,
                        schedulerOpenDustCover: !schedulerOpenDustCover
                    });
                    setSettings(Settings.schedulerOpenDustCover, event.target.checked);
                }}
            />
            <Button
                onClick={() => dispatch(ekosActions.invokeMethod("Scheduler", "runStartupProcedure"))}
            >
                {s.statuses.run}
            </Button>
        </>
    )
}

export default ObservatoryStartup;