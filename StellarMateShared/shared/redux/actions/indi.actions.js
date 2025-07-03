import commands from "../../commands";
import { indiConstants } from "../constants";
import { wssMessageSocketActions } from "./wssMessageSocketActions";

export const indiActions = {
    sendDeviceProperty,
    getDeviceProperty,

    sendNewSwitches,
    sendNewNumbers,
    sendNewTexts,
    sendNewLights,
    subscribeToProperty,
    unsubscribeToProperty,
    subscribeToGroup,
    unsubscribeToGroup,
    setINDIParameterValue,
    clearDevicesNeedingRefresh,
};

function clearDevicesNeedingRefresh()
{
    return { type: indiConstants.CLEAR_DEVICES_NEEDING_REFRESH };
}

function sendDeviceProperty(device, property, elements)
{
    return wssMessageSocketActions.sendText({ device, property, elements }, commands.DEVICE_PROPERTY_SET)
}

function getDeviceProperty(device, property, compact)
{
    return wssMessageSocketActions.sendText({ device, property, compact }, commands.DEVICE_PROPERTY_GET)
}

/**
 * Prepare action to set INDI Device property with elements after transforming raw properties to final properties
 * as expected by Ekos
 * @param device Device Name
 * @param property Property name
 * @param elements Array of elements to be mapped.
 * @returns Action that can be dispatched to set the property in Ekos.
 */
function sendNewSwitches(device, property, elements)
{
    return wssMessageSocketActions.sendText(
        {
            device,
            property,
            elements: elements.map(oneElement => ({ name: oneElement.name, state: oneElement.targetState }))
        }, commands.DEVICE_PROPERTY_SET);
}

function sendNewNumbers(device, property, elements)
{
    return wssMessageSocketActions.sendText({
        device,
        property,
        elements: elements.map(oneElement => ({ name: oneElement.name, value: oneElement.targetValue }))
    }, commands.DEVICE_PROPERTY_SET);
}

function sendNewTexts(device, property, elements)
{
    return wssMessageSocketActions.sendText({
        device,
        property,
        elements: elements.map(oneElement => ({ name: oneElement.name, text: oneElement.targetText }))
    }, commands.DEVICE_PROPERTY_SET);
}

function sendNewLights(device, property, elements)
{
    return wssMessageSocketActions.sendText({
        device,
        property,
        elements: elements.map(oneElement => ({ name: oneElement.name, state: oneElement.targeState }))
    }, commands.DEVICE_PROPERTY_SET)
}

function subscribeToProperty(device, property, permanent)
{
    return dispatch =>
    {
        dispatch({
            type: commands.DEVICE_PROPERTY_SUBSCRIBE,
            payload: { device, property, permanent }
        })

        if (property instanceof Array)
        {
            dispatch(wssMessageSocketActions.sendText({
                device: device,
                properties: property
            }, commands.DEVICE_PROPERTY_SUBSCRIBE));
        } else
        {
            dispatch(wssMessageSocketActions.sendText({
                device: device,
                properties: [property]
            }, commands.DEVICE_PROPERTY_SUBSCRIBE));
        }
    }
}

function unsubscribeToProperty(device, property)
{
    return dispatch =>
    {
        dispatch({
            type: commands.DEVICE_PROPERTY_UNSUBSCRIBE,
            payload: { device, property }
        });

        if (property instanceof Array)
        {
            dispatch(wssMessageSocketActions.sendText({
                device: device,
                properties: property
            }, commands.DEVICE_PROPERTY_UNSUBSCRIBE));
        } else
        {
            dispatch(wssMessageSocketActions.sendText({
                device: device,
                properties: [property]
            }, commands.DEVICE_PROPERTY_UNSUBSCRIBE));
        }
    }
}

function subscribeToGroup(device, group)
{
    return wssMessageSocketActions.sendText({
        device: device,
        groups: [group]
    }, commands.DEVICE_PROPERTY_SUBSCRIBE);
}

function unsubscribeToGroup(device, group)
{
    return wssMessageSocketActions.sendText({
        device: device,
        groups: [group]
    }, commands.DEVICE_PROPERTY_UNSUBSCRIBE);
}

// Generic parameter set for INDI reducer
function setINDIParameterValue(key, value)
{
    return {
        type: indiConstants.SET_INDI_PARAMETER_VALUE,
        payload: { [key]: value },
    };
}
