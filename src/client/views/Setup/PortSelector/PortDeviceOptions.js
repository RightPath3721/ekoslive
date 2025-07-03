import { Button, Input, Typography } from "@mui/material";
import { isEmpty, isEqual } from "lodash";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import commands from "@commands";
import { wssMessageSocketActions } from "@redux/actions";
import {
	propertySelector,
	elementSelector,
	elementAttributeSelector,
} from "@redux/selectors";
import { IPState, ISState } from "@indi/enums";
import { Palette } from "@common/shared/common/styles";
import { styles } from "../../../shared/styles";
import Dropdown from "../../../Components/Dropdown";
import INDISwitchProperty from "../../INDIControlPanel/properties/INDISwitchProperty";
import { Box } from "@mui/system";
import Icon from "../../../Components/Icon";

const LOCAL_styles = {
	lightGrey: {
		backgroundColor: Palette.greycc,
		borderColor: Palette.grey44,
	},
	lightGreen: {
		backgroundColor: Palette.green,
		borderColor: "#228B22",
	},
	lightYellow: {
		backgroundColor: Palette.greycc,
		borderColor: "#d9bd67",
	},
	lightRed: {
		backgroundColor: Palette.greycc,
		borderColor: "#db3f3f",
		borderWidth: "1px",
	},
	switchButton: {
		backgroundColor: Palette.grey44,
		border: "1px solid grey",
		width: "auto",
		height: "35px",
		paddingInline: "15px",
		fontSize: "12px",
		color: "white",
	},
	LED: {
		height: "15px",
		width: "15px",
		borderRadius: "15px",
	},
	searchInput: {
		height: "auto",
		fontSize: "14px",
		flexGrow: 1,
		backgroundColor: "#1d1d1d",
		marginRight: "16px",
		paddingLeft: "12px",
	},
};

const PortDeviceOptions = ({ device }) =>
{
	const dispatch = useDispatch();

	const [connectionColor, setConnectionColor] = useState(
		LOCAL_styles.lightGrey,
	);
	const ConnectionSP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "CONNECTION",
			}),
		isEqual,
	);

	/**
	 * Change Connection Color.
	 */
	useEffect(() =>
	{
		if (!isEmpty(ConnectionSP))
		{
			switch (ConnectionSP.state) {
				case IPState.IPS_IDLE:
					setConnectionColor(LOCAL_styles.lightGrey);
					break;
				case IPState.IPS_OK:
					setConnectionColor(LOCAL_styles.lightGreen);
					break;
				case IPState.IPS_BUSY:
					setConnectionColor(LOCAL_styles.lightYellow);
					break;
				case IPState.IPS_ALERT:
					setConnectionColor(LOCAL_styles.lightRed);
					break;
			}
		}
	}, [ConnectionSP?.state]);

	// Connection Mode Property
	const ConnectionModeSP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "CONNECTION_MODE",
			}),
		isEqual,
	);
	// Serial and Network Elements
	const ConnectionModeSerialS = useSelector(
		(state) =>
			elementSelector(state, {
				device: device.name,
				property: "CONNECTION_MODE",
				element: "CONNECTION_SERIAL",
			}),
		isEqual,
	);
	const ConnectionModeNetworkS = useSelector(
		(state) =>
			elementSelector(state, {
				device: device.name,
				property: "CONNECTION_MODE",
				element: "CONNECTION_TCP",
			}),
		isEqual,
	);

	const DevicePortTP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "DEVICE_PORT",
			}),
		isEqual,
	);

	// If property is valid, then get the text value
	//const DevicePortText = get(DevicePortTP, "texts[0].text", "");
	const DevicePortText = useSelector(
		(state) =>
			elementAttributeSelector(state, {
				device: device.name,
				property: "DEVICE_PORT",
				element: "PORT",
				attribute: "text",
			}),
		isEqual,
	);
	// Set initial internal state of the port name to the property element value
	const [portNameInput, setPortNameInput] = useState(DevicePortText);

	// Set up an effect where as INDI DEVICE_PORT.PORT changes are immediately reflected in our local state variable PortNameInput
	useEffect(() =>
	{
		setPortNameInput(DevicePortText);
	}, [DevicePortText]);

	// System Ports Property
	const SystemPortSP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "SYSTEM_PORTS",
			}),
		isEqual,
	);

	const [systemPortLabels, setSystemPortLabels] = useState([]);
	useEffect(() =>
	{
		if (SystemPortSP)
		{
			let labels = [];
			if (SystemPortSP.switches && Array.isArray(SystemPortSP.switches)) {
				SystemPortSP.switches.forEach((switchProp) =>
					labels.push(switchProp.name),
				);
			}
			setSystemPortLabels(labels);
		}
	}, [SystemPortSP]);

	// Baud Rate Property
	const BaudRateSP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "DEVICE_BAUD_RATE",
			}),
		isEqual,
	);

	{
		/* --------------------------- Network Properties --------------------------- */
	}
	// Device Address (Host + Port) Property
	const DeviceAddressTP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "DEVICE_ADDRESS",
			}),
		isEqual,
	);

	const DeviceHostT = useSelector(
		(state) =>
			elementAttributeSelector(state, {
				device: device.name,
				property: "DEVICE_ADDRESS",
				element: "ADDRESS",
				attribute: "text",
			}),
		isEqual,
	);

	const DevicePortT = useSelector(
		(state) =>
			elementAttributeSelector(state, {
				device: device.name,
				property: "DEVICE_ADDRESS",
				element: "PORT",
				attribute: "text",
			}),
		isEqual,
	);

	// Set internal state
	const [hostInput, setHostInput] = useState("");
	const [portInput, setPortInput] = useState("");

	useEffect(() =>
	{
		if (DeviceHostT) setHostInput(DeviceHostT);
		if (DevicePortT) setPortInput(DevicePortT);
	}, [DeviceHostT, DevicePortT]);

	// Connection Type
	const ConnectionTypeSP = useSelector(
		(state) =>
			propertySelector(state, {
				device: device.name,
				property: "CONNECTION_TYPE",
			}),
		isEqual,
	);

	/**
	 * Send new switch property to client.
	 * @param property - Name of property.
	 */
	const sendNewSwitch = (property) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				{
					device: device.name,
					property: property.name,
					elements: property.switches.map((oneElement) => ({
						name: oneElement.name,
						state: oneElement.targetState,
					})),
				},
				commands.DEVICE_PROPERTY_SET,
			),
		);
	};

	/**
	 * Send new Text property to client.
	 * @param property - Name of property.
	 */
	const sendNewText = (property) =>
	{
		dispatch(
			wssMessageSocketActions.sendText(
				{
					device: device.name,
					property: property.name,
					elements: property.texts.map((oneElement) => ({
						name: oneElement.name,
						text: oneElement.targetText,
					})),
				},
				commands.DEVICE_PROPERTY_SET,
			),
		);
	};

	// Connect / Disconnect Switches
	const ConnectionSwitches = () =>
	{
		if (isEmpty(ConnectionSP)) return null;
		return ConnectionSP.switches.map((oneSwitch, index) =>
		{
			return (
				<Button
					key={index}
					sx={[
						LOCAL_styles.switchButton,
						{
							backgroundColor:
								oneSwitch.state === ISState.ISS_ON ? "green" : Palette.grey33,
							border: "1px solid white",
						},
					]}
					onClick={() =>
					{
						ConnectionSP.setElementTargetValue(oneSwitch.name);
						sendNewSwitch(ConnectionSP);
					}}
				>
					{oneSwitch.name === "CONNECT" ? (
						<Icon name="power" color="white" />
					) : (
						<Icon name="power-off" color="white" />
					)}
				</Button>
			);
		});
	};

	// Generic Switch
	const SwitchButton = ({ property, switchProperty }) =>
	{
		return (
			<Button
				sx={[
					LOCAL_styles.switchButton,
					switchProperty.state === ISState.ISS_ON
						? {
								backgroundColor: "green",
								border: "1px solid white",
							}
						: null,
				]}
				onClick={() =>
				{
					property.setElementTargetValue(switchProperty.name);
					sendNewSwitch(property);
				}}
			>
				{switchProperty.label}
			</Button>
		);
	};

	return (
		<Box sx={[styles.row, { gap: "12px", alignItems: "center" }]}>
			<Box sx={[LOCAL_styles.LED, connectionColor]} />
			<Typography
				sx={[
					styles.text,
					{
						width: "200px",
						fontSize: "14px",
						padding: "6px 0px 6px 16px",
						backgroundColor: "#1d1d1d",
					},
				]}
			>
				{device.name}
			</Typography>

			{/* 3. Serial/Network switches. In case one is not present at all, it is rendered DISABLED.
         in case it is present, it is rendered depending on its switch state ON/OFF
         */}
			{!ConnectionModeSerialS && (
				<Button disabled={true} style={LOCAL_styles.switchButton}>
					Serial
				</Button>
			)}
			{ConnectionModeSP &&
				ConnectionModeSP.switches.map((oneSwitch, index) => (
					<SwitchButton
						key={index}
						property={ConnectionModeSP}
						switchProperty={oneSwitch}
					/>
				))}
			{!ConnectionModeNetworkS && (
				<Button disabled={true} style={LOCAL_styles.switchButton}>
					Network
				</Button>
			)}

			{/* --------------------------- Serial Options --------------------------- */}
			{SystemPortSP && BaudRateSP && DevicePortTP && (
				<>
					{/* Serial Port Text/Dropdown selection */}
					<Box
						sx={[
							styles.row,
							{
								flexGrow: 1,
								borderColor: Palette.grey66,
								marginRight: "5px",
							},
						]}
					>
						<Input
							sx={[LOCAL_styles.searchInput, styles.text]}
							value={portNameInput || ""}
							disableUnderline
							onEnded={() =>
							{
								if (!isEmpty(DevicePortTP))
								{
									DevicePortTP.setElementTargetValue("PORT", portNameInput);
									sendNewText(DevicePortTP);
								}
							}}
							onChange={(e) =>
							{
								setPortNameInput(e.target.value);
							}}
						/>
						<Box sx={[styles.center]}>
							<Dropdown
								options={systemPortLabels.map((name) => ({ label: name }))}
								onChange={(selectedSwitch) =>
								{
									if (!isEmpty(SystemPortSP))
									{
										SystemPortSP.setElementTargetValue(selectedSwitch.text);
										sendNewSwitch(SystemPortSP);
									}
								}}
							/>
						</Box>
					</Box>
					{/* Baud Rate Selection */}
					<Box style={{ marginRight: "10px", alignSelf: "center" }}>
						<INDISwitchProperty
							height="auto"
							property={BaudRateSP}
							sendNewElement={sendNewSwitch}
						/>
					</Box>
				</>
			)}
			{/* --------------------------- Network Options -------------------------- */}
			{DeviceAddressTP && ConnectionTypeSP && (
				<>
					{/* Host Name */}
					<Input
						width="220px"
						sx={[LOCAL_styles.searchInput, styles.text]}
						value={hostInput}
						disableUnderline
						placeholder="Hostname or IP Address"
						onEnded={() =>
						{
							if (!isEmpty(DeviceAddressTP))
							{
								DeviceAddressTP.setElementTargetValue("ADDRESS", hostInput);
								sendNewText(DeviceAddressTP);
							}
						}}
						onChange={(e) =>
						{
							setHostInput(e.target.value);
						}}
					/>
					{/* Port */}
					<Input
						width="220px"
						sx={[LOCAL_styles.searchInput, styles.text]}
						value={portInput}
						disableUnderline
						placeholder="Port"
						onEnded={() =>
						{
							if (!isEmpty(DeviceAddressTP))
							{
								DeviceAddressTP.setElementTargetValue("PORT", portInput);
								sendNewText(DeviceAddressTP);
							}
						}}
						onChange={(e) =>
						{
							setPortInput(e.target.value);
						}}
					/>
					{/* Connection Type TCP or UDP */}
					<Box sx={[styles.row, { marginLeft: "12px", marginRight: "12px" }]}>
						{ConnectionTypeSP.switches.map((oneSwitch, index) => (
							<SwitchButton
								key={index}
								property={ConnectionTypeSP}
								switchProperty={oneSwitch}
							/>
						))}
					</Box>
				</>
			)}

			<Box sx={{ display: "flex", gap: "6px" }}>
				<ConnectionSwitches />
			</Box>
		</Box>
	);
};

export default PortDeviceOptions;
