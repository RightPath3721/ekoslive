import { Box, Button, Typography } from "@mui/material";
import { isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CloseButton from "../../../Components/CloseButton";
import { indiActions } from "@redux/actions";
import { deviceActions } from '@redux/actions/devices.web.actions';
import { profileActions } from "@redux/actions";
import { selectDevicesInfo, selectIndiDevices, selectIsLoggedIn } from "@redux/selectors";
import s from "@common/shared/i18n/i18n";
import { styles } from "../../../shared/styles";
import { Palette } from "@common/shared/common/styles";
import PortDeviceOptions from "./PortDeviceOptions";

const LOCAL_STYLES = {
    connectBtn: { width: "150px", backgroundColor: Palette.orange },
}

const PortSelector = ({ togglePortSelector }) => 
{
    const dispatch = useDispatch();

    const devicesInfo = useSelector(selectDevicesInfo);
    const devices = useSelector(selectIndiDevices, isEqual);
    const loggedIn = useSelector(selectIsLoggedIn);

    const [devicesWithPorts, setDevicesWithPorts] = useState([]);
    const [requestedDevices, setRequestedDevices] = useState([]);

    /**
     * Action to take when Ekos profile is online.
     */
    useEffect(() =>
    {
        if (loggedIn)
        {
            // Get StellarSolver profiles
            dispatch(profileActions.getStellarSolverProfiles());
            dispatch(deviceActions.getDevices());
        } else
        {
            setRequestedDevices([]);
        }
    }, [loggedIn]);

    /**
     * Whenever we get a new device info, we ask to retrieve its properties.
     */
    useEffect(() =>
    {
        // Only fetch device properties if:
        if (!isEmpty(devicesInfo))
        {
            let newDevices = [];
            for (const oneInfo of devicesInfo)
            {
                if (requestedDevices.includes(oneInfo.name))
                    continue;
                dispatch(deviceActions.getDevice(oneInfo.name));
                newDevices.push(oneInfo.name);
            }

            setRequestedDevices([...requestedDevices, newDevices]);
        }
    }, [devicesInfo]);

    useEffect(() =>
    {
        if (isEmpty(devices))
        {
            setDevicesWithPorts([]);
        }

        else 
        {
            for (const oneDevice of devices)
            {
                // If already exists, skip
                if (devicesWithPorts.find(device => device.name === oneDevice.name))
                    continue;


                const hasSerialConnection = !isEmpty(oneDevice.getProperty("DEVICE_PORT_SCAN"));
                const hasNetworkConnection = !isEmpty(oneDevice.getProperty("CONNECTION_TYPE"));
                if (hasSerialConnection || hasNetworkConnection)
                {
                    setDevicesWithPorts([...devicesWithPorts, oneDevice]);
                    dispatch(indiActions.subscribeToProperty(oneDevice.name, "CONNECTION_MODE"));

                    // --------------------------- Serial Properties ---------------------------
                    dispatch(indiActions.subscribeToProperty(oneDevice.name, "DEVICE_PORT"));
                    dispatch(indiActions.subscribeToProperty(oneDevice.name, "SYSTEM_PORTS"));
                    dispatch(indiActions.subscribeToProperty(oneDevice.name, "DEVICE_BAUD_RATE"));

                    // --------------------------- Network Properties ---------------------------
                    dispatch(indiActions.subscribeToProperty(oneDevice.name, "DEVICE_ADDRESS"));
                    dispatch(indiActions.subscribeToProperty(oneDevice.name, "CONNECTION_TYPE"));

                }
            }
        }
    }, [devices]);

    /**
     * If we get disconnect from Ekos, clear all devices and close the dialog.
     */
    useEffect(() =>
    {
        if (!isEmpty(devices) && loggedIn === false)
        {
            setDevicesWithPorts([]);
            togglePortSelector();
        }
    }, [loggedIn]);

    return (
        <Box sx={{ position: "relative", padding: "16px", display: "flex", flexDirection: "column", gap: "32px" }}>
            <CloseButton right="15px" top="15px" onChange={togglePortSelector} />
            <Typography sx={styles.text}>{s.connect.btn_port_select}</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", rowGap: "12px" }}>
                {!isEmpty(devicesWithPorts) && !isEmpty(devices) && devicesWithPorts.map(device => <PortDeviceOptions
                    device={device} key={device.name} />)}
            </Box>
            <Button
                sx={[LOCAL_STYLES.connectBtn, { fontSize: "14px", color: "white", margin: "0 auto" }]}
                onClick={() =>
                {
                    dispatch(profileActions.portSelectorConnectAll());
                    togglePortSelector()
                }}
            >
                {s.connect.port_selector.connect_all}
            </Button>
        </Box>
    )

}

export default PortSelector;