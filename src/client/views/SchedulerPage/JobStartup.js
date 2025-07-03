import React, { useState } from "react";
import { Box } from "@mui/material";
import { get, isEqual } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { schedulerActions } from "@redux/actions";
import { selectSchedulerSettings } from "@redux/selectors";
import DatePicker from "../../Components/DateDialog";
import RadioButton from "../../Components/RadioButton";
import s from "@common/shared/i18n/i18n";

const JobStartup = () => 
{
    const dispatch = useDispatch();
    const schedulerSettings = useSelector(selectSchedulerSettings, isEqual);
    const [state, setState] = useState({
        asapConditionR: get(schedulerSettings, "asapConditionR", false),
        startupTimeConditionR: get(schedulerSettings, "startupTimeConditionR", false),
        startupTimeEdit: get(schedulerSettings, "startupTimeEdit", new Date()),
    });

    const { asapConditionR, startupTimeConditionR, startupTimeEdit } = state;

    const setSettings = (key, value) =>
    {
        dispatch(schedulerActions.setAllSettings({ [key]: value }));
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "row", gap: "32px", padding: "10px 4px 4px 4px" }}>
            <RadioButton
                data={[
                    {
                        label: "ASAP",
                        handleChange: () =>
                        {
                            setSettings("asapConditionR", !asapConditionR)
                            setState({
                                ...state,
                                asapConditionR: !asapConditionR,
                                startupTimeConditionR: false
                            })
                        },
                        value: asapConditionR,
                    },
                    {
                        label: s.general.on,
                        handleChange: () =>
                        {
                            setSettings("startupTimeConditionR", !startupTimeConditionR);
                            setState({
                                ...state,
                                asapConditionR: false,
                                startupTimeConditionR: !startupTimeConditionR
                            })
                        },
                        value: startupTimeConditionR,
                    },
                ]}
            />
            <DatePicker
                value={dayjs(startupTimeEdit)}
                mode='datetime'
                is24Hour={true}
                handleChange={(selectedtime) =>
                {
                    // TODO fix it
                    const isoFormat = dayjs(selectedtime).format("YYYY-MM-DDTHH:mm:ss");
                    setSettings("startupTimeEdit", isoFormat);
                    setState({ ...state, startupTimeEdit: isoFormat });
                }}
            />
        </Box>
    )
}

export default JobStartup;