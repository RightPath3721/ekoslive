import React, { useState, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Input from "@mui/material/Input";
import Icon from "../Icon";
import Button from "./Button";

const NumericInput = ({
	iconSize = 30,
	borderColor = "#d4d4d4",
	iconStyle = {},
	totalWidth = 183,
	sepratorWidth = 1,
	type = "plus-minus",
	rounded = false,
	textColor = "#FFFCFA",
	containerStyle = {},
	inputStyle = {},
	initValue = null,
	valueType = "integer",
	value = null,
	minValue = null,
	maxValue = null,
	incrementStep = 1,
	decrementStep = 1,
	upDownButtonsBackgroundColor = "white",
	rightButtonBackgroundColor = "#FFFFFF1A",
	leftButtonBackgroundColor = "#FFFFFF1A",
	editable = true,
	validateOnBlur = true,
	reachMaxIncIconStyle = {},
	reachMaxDecIconStyle = {},
	reachMinIncIconStyle = {},
	reachMinDecIconStyle = {},
	onLimitReached = () => {},
	extraTextInputProps = {},
	...props
}) => {
	const noInitSent = initValue !== 0 && !initValue;
	const [state, setState] = useState({
		initValue: initValue,
		value: noInitSent ? (value ? value : 0) : initValue,
		lastValid: noInitSent ? (value ? value : 0) : initValue,
		stringValue: (noInitSent
			? value
				? value
				: 0
			: initValue
		).toString(),
	});
	const ref = useRef(null);

	useEffect(() => {
		const initSent = !(initValue !== 0 && !initValue);
		if (initValue !== state.initValue && initSent) {
			setState({
				initValue: initValue,
				value: initValue,
				lastValid: initValue,
				stringValue: initValue.toString(),
			});
		}
	}, [initValue, state.initValue]);

	const inc = () => {
		let value = state.value;
		if (
			maxValue === null ||
			+value + incrementStep <= maxValue
		) {
			value = (value === "--" ? 0 : +value + incrementStep).toFixed(12);
			value = valueType === "float" ? parseFloat(value) : parseInt(value);
			setState(prev => ({ ...prev, value, stringValue: value.toString() }));
		} else {
			onLimitReached?.(true, "Reached Maximum Value!");
			value = maxValue;
			setState(prev => ({ ...prev, value, stringValue: value.toString() }));
		}
		props.onChange?.(Number(value));
	};

	const dec = () => {
		let value = state.value;
		if (
			minValue === null ||
			value - decrementStep >= minValue
		) {
			value = (value === "--" ? 0 : value - decrementStep).toFixed(12);
			value = valueType === "float" ? parseFloat(value) : parseInt(value);
			setState(prev => ({ ...prev, value, stringValue: value.toString() }));
		} else {
			onLimitReached?.(false, "Reached Minimum Value!");
			value = minValue;
			setState(prev => ({ ...prev, value, stringValue: value.toString() }));
		}
		props.onChange?.(Number(value));
	};

	const isLegalValue = (value, mReal, mInt) =>
		value === "" ||
		(((valueType === "float" && mReal(value)) ||
			(valueType !== "float" && mInt(value))) &&
			(maxValue === null ||
				parseFloat(value) <= maxValue) &&
			(minValue === null ||
				parseFloat(value) >= minValue));

	const realMatch = (value) =>
		value &&
		value.match(/-?\d+(\.(\d+)?)?/) &&
		value.match(/-?\d+(\.(\d+)?)?/)[0] ===
			value.match(/-?\d+(\.(\d+)?)?/).input;

	const intMatch = (value) =>
		value &&
		value.match(/-?\d+/) &&
		value.match(/-?\d+/)[0] === value.match(/-?\d+/).input;

	const onChange = (value) => {
		let currValue = typeof value === "number" ? value : state.value;
		if (
			(value.length === 1 && value === "--") ||
			(value.length === 2 && value === "0-")
		) {
			setState(prev => ({ ...prev, stringValue: "--" }));
			return;
		}
		if (
			(value.length === 1 && value === ".") ||
			(value.length === 2 && value === "0.")
		) {
			setState(prev => ({ ...prev, stringValue: "0." }));
			return;
		}
		if (value.charAt(value.length - 1) === ".")
		{
			setState(prev => ({ ...prev, stringValue: value }));
			return;
		}
		let legal = isLegalValue(value, realMatch, intMatch);
		if (legal)
		{
			setState(prev => ({ ...prev, lastValid: value }));
		}
		if (!legal && !validateOnBlur)
		{
			if (ref.current)
			{
				ref.current.blur();
				setTimeout(() =>
				{
					setTimeout(() =>
					{
						props.onChange?.(currValue - 1);
						setState(prev => ({ ...prev, value: currValue - 1, legal }));
						props.onChange?.(currValue);
					}, 10);
				}, 15);
				setTimeout(() => ref.current?.focus(), 20);
			}
		}
		else if (!legal && validateOnBlur)
		{
			setState(prev => ({ ...prev, stringValue: value }));
			let parsedValue =
				valueType === "float" ? parseFloat(value) : parseInt(value);
			parsedValue = isNaN(parsedValue) ? 0 : parsedValue;
			if (parsedValue !== value)
				props.onChange?.(parsedValue);
			setState(prev => ({ ...prev, value: parsedValue, legal, stringValue: value }));
		}
		else
		{
			setState(prev => ({ ...prev, stringValue: value }));
			let parsedValue =
				valueType === "float" ? parseFloat(value) : parseInt(value);
			parsedValue = isNaN(parsedValue) ? 0 : parsedValue;
			if (parsedValue !== value)
				props.onChange?.(parsedValue);
			setState(prev => ({ ...prev, value: parsedValue, legal, stringValue: value }));
		}
	};

	const onBlur = () => {
		let match = state.stringValue.match(/-?[0-9]\d*(\.\d+)?/);
		let legal =
			match &&
			match[0] === match.input &&
			(maxValue === null ||
				parseFloat(state.stringValue) <= maxValue) &&
			(minValue === null ||
				parseFloat(state.stringValue) >= minValue);
		if (!legal)
		{
			if (
				!isNaN(minValue) &&
				parseFloat(state.stringValue) <= minValue
			)
			{
				onLimitReached?.(true, "Reached Minimum Value!");
			}
			if (
				!isNaN(maxValue) &&
				parseFloat(state.stringValue) >= maxValue
			)
			{
				onLimitReached?.(false, "Reached Maximum Value!");
			}
			if (ref.current)
			{
				ref.current.blur();
				setTimeout(() =>
				{
					setTimeout(() =>
					{
						props.onChange?.(state.lastValid);
						setState(prev => ({ ...prev, value: state.lastValid, stringValue: state.lastValid.toString() }));
						props.onChange?.(state.lastValid);
					}, 10);
				}, 15);
				setTimeout(() => ref.current?.focus?.(), 50);
			}
		}
		props.onBlur?.(state.value);
	};

	const onFocus = () => {
		setState(prev => ({ ...prev, lastValid: state.value }));
		props.onFocus?.();
	};

	const inputWidth = totalWidth - totalWidth / 2.25;
	const totalHeight = props.totalHeight ? props.totalHeight : 42;
	const borderRadiusTotal = totalHeight * 0.18;
	const fontSize = totalHeight * 0.38;
	const inputContainerStyle =
		type === "up-down"
			? [
					style.inputContainerUpDown,
					{
						width: totalWidth,
						height: totalHeight,
						borderColor: borderColor,
						backgroundColor: "#272727",
					},
					rounded ? { borderRadius: borderRadiusTotal } : {},
					containerStyle,
				]
			: [
					style.inputContainerPlusMinus,
					{
						width: totalWidth,
						height: totalHeight,
						borderColor: borderColor,
					},
					rounded ? { borderRadius: borderRadiusTotal } : {},
					containerStyle,
				];
	const computedInputStyle =
		type === "up-down"
			? [
					style.inputUpDown,
					{
						width: inputWidth,
						height: totalHeight,
						fontSize: fontSize,
						color: textColor,
						borderRightWidth: 2,
						borderRightColor: borderColor,
					},
					inputStyle,
				]
			: [
					style.inputPlusMinus,
					{
						width: inputWidth,
						height: totalHeight,
						fontSize: fontSize,
						color: textColor,
						borderLeftWidth: sepratorWidth,
						borderLeftColor: borderColor,
						borderRightWidth: sepratorWidth,
						borderRightColor: borderColor,
						outline: "none",
						overflow: "hidden",
						textAlign: "center",
					},
					inputStyle,
				];
	const upDownStyle = [
		{
			alignItems: "center",
			width: totalWidth - inputWidth,
			backgroundColor: upDownButtonsBackgroundColor,
			borderRightWidth: 1,
			borderRightColor: borderColor,
		},
		rounded
			? {
					borderTopRightRadius: borderRadiusTotal,
					borderBottomRightRadius: borderRadiusTotal,
				}
			: {},
	];
	const buttonStyle = {
		height: totalHeight,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 0,
		backgroundColor: rightButtonBackgroundColor,
		width: totalWidth / 2.25 / 2,
	};

	if (type === "up-down")
		return (
			<Box sx={[...inputContainerStyle, { opacity: editable ? 1 : 0.6 }]}>
				<Input
					{...extraTextInputProps}
					readOnly={!editable}
					value={state.stringValue}
					onChange={(e) => onChange(e.target.value)}
					sx={computedInputStyle}
					inputRef={ref}
					onBlur={onBlur}
					onFocus={onFocus}
					disableUnderline
				/>
				<Box sx={upDownStyle}>
					<Button
						disabled={!editable}
						onClick={inc}
						sx={{ flex: 1, width: "100%", alignItems: "center" }}
					>
						<Icon name="arrow-up" size={fontSize} color="#CECECE" />
					</Button>
					<Button
						disabled={!editable}
						onClick={dec}
						sx={{ flex: 1, width: "100%", alignItems: "center" }}
					>
						<Icon name="arrow-down" size={fontSize} color="#CECECE" />
					</Button>
				</Box>
			</Box>
		);
	else
		return (
			<Box
				sx={[
					...inputContainerStyle,
					{ backgroundColor: "#272727", opacity: editable ? 1 : 0.6 },
				]}
			>
				<Button
					disabled={!editable}
					onClick={dec}
					style={{
						...buttonStyle,
						borderRadius: "4px 0px 0px 4px",
					}}
				>
					<Icon name="remove" size={fontSize} color="#CECECE" />
				</Button>
				<Input
					{...extraTextInputProps}
					readOnly={!editable}
					value={state.stringValue}
					onChange={(e) => onChange(e.target.value)}
					sx={computedInputStyle}
					inputRef={ref}
					inputProps={{ style: { textAlign: "center" } }}
					onBlur={onBlur}
					onFocus={onFocus}
					disableUnderline
				/>
				<Button
					disabled={!editable}
					onClick={inc}
					style={{
						...buttonStyle,
						borderRadius: "0px 4px 4px 0px",
					}}
				>
					<Icon name="add" size={fontSize} color="#CECECE" />
				</Button>
			</Box>
		);
};

const style = {
	inputContainerUpDown: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderColor: "grey",
		borderWidth: 1,
	},
	inputContainerPlusMinus: {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderWidth: 1,
	},
	inputUpDown: {
		textAlign: "center",
		padding: 0,
	},
	inputPlusMinus: {
		textAlign: "center",
		padding: 0,
	},
	icon: {
		fontWeight: "900",
		backgroundColor: "rgba(0,0,0,0)",
	},
	upDown: {
		alignItems: "center",
		paddingRight: 15,
	},
};

export default NumericInput;
