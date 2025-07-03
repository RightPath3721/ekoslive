import React from "react";
import { Box, Button } from "@mui/material";
import { isEmpty } from "lodash";
import Dropdown from "../../../Components/Dropdown";
import { ISRule, ISState } from "@indi/enums";
import { styles } from "../../../shared/styles";
import { Palette } from "@common/shared/common/styles";

const INDISwitchProperty = ({ property, sendNewElement }) =>
{
	if (isEmpty(property))
	{
		return null;
	}
	else
	{
		if (property.rule === ISRule.ISR_1OFMANY)
		{
			// if less than 5, render row of buttons
			if (property.switches.length < 5)
			{
				return (
					<Box sx={[styles.row, { gap: "4px" }]}>
						{property.switches.map((switchProperty) => (
							<SwitchButton
								switchProperty={switchProperty}
								property={property}
								sendNewElement={sendNewElement}
								key={switchProperty.name}
							/>
						))}
					</Box>
				);
				// otherwise render a dropdown
			}
			else
			{
				// finding the active switch in initial state or when it gets updated
				const activeSwitch = property.switches.find(
					(sw) => sw.state === ISState.ISS_ON,
				);

				return (
					<Dropdown
						value={activeSwitch?.label}
						options={property.switches.map((item) => ({
							label: `${item.label}`,
							name: item.name,
							value: item.label,
						}))}
						onChange={(selectedSwitch) =>
						{
							property.setElementTargetValue(selectedSwitch.name);
							sendNewElement(property);
						}}
					/>
				);
			}
		}
		else if (
			property.rule === ISRule.ISR_ATMOST1 ||
			property.rule === ISRule.ISR_NMANY
		)
		{
			return (
				<Box sx={[styles.row, { gap: "4px" }]}>
					{property.switches.map((switchProperty) => (
						<SwitchButton
							switchProperty={switchProperty}
							property={property}
							sendNewElement={sendNewElement}
							key={switchProperty.name}
						/>
					))}
				</Box>
			);
		}
	}
};

const SwitchButton = ({ switchProperty, property, sendNewElement }) => (
	<Button
		sx={[
			styles.center,
			LOCAL_STYLES.switchBtn,
			switchProperty.state
				? {
						backgroundColor: "#356514",
						border: "1px solid white",
						color: Palette.greyee,
						fontWeight: "bold",
					}
				: null,
		]}
		onClick={() =>
		{
			property.setElementTargetValue(switchProperty.name);
			sendNewElement(property);
		}}
	>
		{switchProperty.label}
	</Button>
);

const LOCAL_STYLES = {
	switchBtn: {
		backgroundColor: Palette.grey33,
		border: `1px solid ${Palette.grey44}`,
		borderRadius: "2px",
		width: "auto",
		padding: "4px 12px",
		color: "white",
		textTransform: "none",
	},
};

export default INDISwitchProperty;
