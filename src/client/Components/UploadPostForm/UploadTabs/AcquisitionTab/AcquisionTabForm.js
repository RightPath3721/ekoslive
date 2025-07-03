import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FiltersList from "./FiltersList";
import FilterSelector from "./FilterSelector";
import AcquisitionSessionInfo from "./AcquisitionSessionInfo";
import { useAcquisitionContext } from "./AcquisitionTabContext";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";

const AcquisionTabForm = ({ setFormValid }) =>
{
	const { submit, filter } = useAcquisitionContext();

	useEffect(() =>
	{
		setFormValid(true);
	}, []);

	return (
		<Box
			component="form"
			sx={{ display: "grid", gridTemplateColumns: "4fr 1fr", gap: "1.25rem" }}
		>
			<FiltersList />
			<Button
				disabled={!filter}
				sx={{
					backgroundColor: Palette.orange,
					fontSize: "1rem",
					whiteSpace: "nowrap",
					height: "fit-content",
					color: Palette.white,
				}}
				onClick={submit}
			>
				{s.general.add}
			</Button>
			<FilterSelector />
			<AcquisitionSessionInfo />
		</Box>
	);
};

export default AcquisionTabForm;
