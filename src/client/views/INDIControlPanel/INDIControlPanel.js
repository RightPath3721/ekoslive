import React, { useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { get, isEmpty } from "lodash";
import { Box } from "@mui/material";
import INDIGroups from "./INDIGroups";
import INDIProperties from "./INDIProperties";
import { createSelector } from "reselect";
import Messages from "./Messages";
import { wssMessageSocketActions, indiActions } from "@redux/actions";
import { IPPerm } from "@indi/enums";
import { getKstarsVersion } from "@redux/selectors";
import { formatNumber } from "./utils";
import INDIDevices from "./INDIDevices";
import commands from "@commands";
import {
	deviceNamesSelector,
	groupNamesSelector,
	selectPermanentSubscriptions,
} from "@redux/selectors";

const activeGroupPropertiesSelector = createSelector(
	(state) => state.indi.devices,
	(_, props) => props.device,
	(_, props) => props.group,
	(devices, activeDevice, activeGroup) =>
	{
		const selectedDevice = devices.find(
			(oneDevice) => oneDevice.name === activeDevice,
		);
		const groupProperties = get(selectedDevice, "properties", false);

		if (groupProperties)
		{
			return groupProperties.filter(
				(property) => property.group === activeGroup,
			);
		}
	},
);

const INDIControlPanel = ({
	toggled,
	selectedDeviceName,
	setSelectedDeviceName,
	selectedGroupName,
	setSelectedGroupName,
	activeGroups,
	setActiveGroups,
}) =>
{
	const dispatch = useDispatch();

	const [inputNumbers, setInputNumbers] = useState({});
	const [inputTexts, setInputTexts] = useState({});

	const deviceNames = useSelector(deviceNamesSelector, shallowEqual);
	const groupNames = useSelector(
		(state) => groupNamesSelector(state, selectedDeviceName),
		shallowEqual,
	);

	const selectedGroupProperties = useSelector((state) =>
		activeGroupPropertiesSelector(
			state,
			{
				device: selectedDeviceName,
				group: selectedGroupName,
			},
			shallowEqual,
		),
	);

	const kstarsVersion = useSelector(getKstarsVersion);
	const permanent_subscriptions = useSelector(selectPermanentSubscriptions);

	const [firstSubscription, setFirstSubscription] = useState(false);

	// runs once the component is mounted to set the initial device
	useEffect(() =>
	{
		if (!isEmpty(deviceNames))
		{
			const activeDevice = selectedDeviceName
				? deviceNames.find((device) => device === selectedDeviceName)
				: deviceNames[0];
			setSelectedDeviceName(activeDevice);
		}
	}, [deviceNames]);

	/*
	 * Selects a group when a device changes
	 */
	useEffect(() =>
	{
		if (isEmpty(groupNames)) return;

		const group = activeGroups[selectedDeviceName]
			? activeGroups[selectedDeviceName]
			: groupNames[0];
		setSelectedGroupName(group);
	}, [groupNames]);

	/*
	 * When a group is changed, sets the active group to keep track of selected group choices for each device
	 */
	useEffect(() =>
	{
		if (isEmpty(groupNames) || isEmpty(selectedGroupName)) return;

		setActiveGroup(selectedGroupName);
	}, [selectedGroupName]);

	/*
	 * Subscribes when INDI is toggled and unsubscribes when toggling off
	 */
	useEffect(() =>
	{
		if (isEmpty(selectedDeviceName) || isEmpty(selectedGroupProperties)) return;

		if (groupNames)
		{
			// subscribe to the selected group properties (selectedGroupProperties) after they are update
			if (toggled)
			{
				if (selectedGroupProperties && Array.isArray(selectedGroupProperties)) {
					selectedGroupProperties.forEach((property) =>
						dispatch(
							indiActions.subscribeToProperty(selectedDeviceName, property.name),
						),
					);
				}

				if (!firstSubscription) setFirstSubscription(true);
			}
			else
			{
				// prevents unsubscribing when first starting while building the devices and toggle is off
				if (firstSubscription) handleGroupUnsubscribe();
			}
		}
	}, [selectedDeviceName, selectedGroupName, toggled]);

	/*
	 * syncs the input fields on device or group change
	 */
	useEffect(() =>
	{
		if (isEmpty(selectedDeviceName) || isEmpty(selectedGroupName)) return;

		syncInputFields();
	}, [selectedDeviceName, selectedGroupName]);

	/*
	 * Initializes the input fields
	 */
	const syncInputFields = () =>
	{
		// building out the input objects
		let initialTexts = {};
		let initialNumbers = {};

		if (!selectedGroupProperties || !Array.isArray(selectedGroupProperties)) return;

		selectedGroupProperties.forEach((property) =>
		{
			// only add properties that are writable
			if (property.numbers && property.perm !== IPPerm.IP_RO)
				// adding the initial property values to the input field state (for default string values)
				if (property.numbers && Array.isArray(property.numbers)) {
					property.numbers.forEach((numberElement) =>
					{
						if (initialNumbers[property.name] === undefined)
						initialNumbers[property.name] = {};
					initialNumbers[property.name][numberElement.name] =
							`${formatNumber(get(numberElement, "format", "%.f"), numberElement.value ?? 0)}`;
					});
				}
			else if (property.texts && property.perm !== IPPerm.IP_RO)
				if (property.texts && Array.isArray(property.texts)) {
					property.texts.forEach((textElement) =>
					{
						if (initialTexts[property.name] === undefined)
							initialTexts[property.name] = {};
						initialTexts[property.name][textElement.name] = `${textElement.text}`;
					});
				}
		});

		// once all the initial values have been populated up we set them to state
		setInputNumbers(initialNumbers);
		setInputTexts(initialTexts);
	};

	// keeps track of selected groups for each device if it had one
	const setActiveGroup = (group) =>
	{
		setActiveGroups((prev) => ({
			...prev,
			[selectedDeviceName]: group,
		}));
	};

	/*
     unsubscribes from current device and group
     it's run before changing the device or group in lower level components
      */
	const handleGroupUnsubscribe = () =>
	{
		let deviceHasPermanentProps = permanent_subscriptions.find(
			(device) => device.name === selectedDeviceName,
		);

		// if the device has any permanent groups make sure to only unsubscribe from the ones not in the list
		if (deviceHasPermanentProps)
		{
			if (!selectedGroupProperties || !Array.isArray(selectedGroupProperties)) return;
			selectedGroupProperties.forEach((property) =>
			{
				// only unsubscribes if it is not a permanent property
				if (deviceHasPermanentProps.properties.indexOf(property.name) === -1)
				{
					dispatch(
						indiActions.unsubscribeToProperty(
							selectedDeviceName,
							property.name,
						),
					);
				}
			});
		}
		else
		{
			dispatch(
				indiActions.unsubscribeToGroup(selectedDeviceName, selectedGroupName),
			);
		}
	};

	const sendNewNumber = (propertyName, elements) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				{
					device: selectedDeviceName,
					property: propertyName,
					elements: elements.map((oneElement) => ({
						name: oneElement.name,
						value: oneElement.targetValue,
					})),
				},
				commands.DEVICE_PROPERTY_SET,
			),
		);
	};

	const sendNewText = (propertyName, elements) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				{
					device: selectedDeviceName,
					property: propertyName,
					elements: elements.map((oneElement) => ({
						name: oneElement.name,
						text: oneElement.targetText,
					})),
				},
				commands.DEVICE_PROPERTY_SET,
			),
		);
	};

	const sendNewSwitch = (propertyName, elements) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				{
					device: selectedDeviceName,
					property: propertyName,
					elements: elements.map((oneElement) => ({
						name: oneElement.name,
						state: oneElement.targetState,
					})),
				},
				commands.DEVICE_PROPERTY_SET,
			),
		);
	};

	const sendNewElement = (property) =>
	{
		if (property.texts) sendNewText(property.name, property.texts);
		if (property.numbers) sendNewNumber(property.name, property.numbers);
		if (property.switches) sendNewSwitch(property.name, property.switches);
	};

	const setInputText = (property, textElement, text) =>
	{
		setInputTexts({
			...inputTexts,
			[property.name]: {
				...inputTexts[property.name],
				[textElement.name]: text !== undefined ? `${text}` : "",
			},
		});
	};

	const setInputNumberValue = (property, numberElement, value) =>
		setInputNumbers({
			...inputNumbers,
			[property.name]: {
				...inputNumbers[property.name],
				[numberElement.name]: value !== undefined ? `${value}` : ``,
			},
		});

	if (!toggled) return null;

	return (
		<Box sx={{ padding: "20px", overflow: "scroll", height: "100%" }}>
			<Box
				sx={{
					height: "80%",
					display: "flex",
					flexDirection: "column",
					gap: "10px",
				}}
			>
				{/* Devices Bar */}
				<INDIDevices
					devices={deviceNames}
					selectedDeviceName={selectedDeviceName}
					setActiveDevice={setSelectedDeviceName}
					handleGroupUnsubscribe={handleGroupUnsubscribe}
				/>

				{/* Groups Bar */}
				{selectedGroupName && groupNames && (
					<INDIGroups
						selectedGroup={selectedGroupName}
						setSelectedGroupName={setSelectedGroupName}
						deviceGroups={groupNames}
						handleGroupUnsubscribe={handleGroupUnsubscribe}
					/>
				)}

				{/* Properties */}
				{selectedGroupName && !isEmpty(selectedGroupProperties) && (
					<INDIProperties
						properties={selectedGroupProperties}
						inputNumbers={inputNumbers}
						inputTexts={inputTexts}
						sendNewElement={sendNewElement}
						setInputText={setInputText}
						setInputNumberValue={setInputNumberValue}
					/>
				)}
			</Box>
			{!isEmpty(selectedDeviceName) && kstarsVersion === "3.6.5" && (
				<Box sx={{ height: "20%" }}>
					<Messages selectedDevice={selectedDeviceName} />
				</Box>
			)}
		</Box>
	);
};

export default INDIControlPanel;
