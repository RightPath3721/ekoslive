import { Box, Input } from "@mui/material";
import React from "react";
import { styles } from "../shared/styles";
import Icon from "./Icon";

const InputField = ({
	disabled = false,
	width = "150px",
	height = "53px",
	onChange,
	clear,
	value,
	placeholder = "",
	inputProps = {},
}) =>
{
	return (
		<Box sx={styles.row}>
			<Input
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				fullWidth
				inputProps={{ style: { color: "white" } }}
				sx={{
					input: { color: "white", height: height },
					backgroundColor: "#2a2a2a",
					padding: "10px",
					color: "common.white",
					width: width,
					height: height,
					borderBottomLeftRadius: "10px",
					borderTopLeftRadius: "10px",
				}}
				disableUnderline
				onChange={(e) => onChange(e.target.value)}
				slotProps={{ input: { ...inputProps } }}
			/>
			<Box
				sx={[
					styles.text,
					styles.center,
					{
						paddingInline: "6px",
						height,
						backgroundColor: "#2a2a2a",
						cursor: "pointer",
						borderBottomRightRadius: "10px",
						borderTopRightRadius: "10px",
					},
				]}
				onClick={() => (disabled ? null : clear?.())}
				role={typeof clear === "function" ? "button" : "none"}
			>
				<Icon name="Close" color="white" />
			</Box>
		</Box>
	);
};

export default InputField;
