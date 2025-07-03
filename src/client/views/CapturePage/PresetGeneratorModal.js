import React, { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import getDefaultAutoGenerateOptions, {
	autoGeneratingPresetOptions,
} from "@common/shared/common/getDefaultAutoGenerateOptions";
import EkosModal from "@components/EkosModal";
import FormCheckbox from "@components/FormCheckbox";
import s from "@common/shared/i18n/i18n";
import generatePresetName from "@common/shared/common/generatePresetName";

const PresetGeneratorModal = ({
	close,
	open,
	preset,
	updateCheckedList,
	autoGenerateName,
	setAutoGenerateName,
	captureFormats,
	captureIndex,
	activeSettings,
	setArrayList,
}) =>
{
	const [autoGeneratorOptions, setAutoGeneratorOptions] = useState(
		getDefaultAutoGenerateOptions(preset),
	);

	const onOptionChange = useCallback(
		(key, optionKey) =>
		{
			return (e) =>
			{
				setAutoGeneratorOptions((prevOptions) => ({
					...prevOptions,
					[key]: e.target.checked,
				}));
				updateCheckedList((prevList) =>
				{
					if (prevList.includes(optionKey))
					{
						return prevList.filter((item) => item !== optionKey);
					}
					else
					{
						return [...prevList, optionKey];
					}
				});
			};
		},
		[setAutoGeneratorOptions],
	);

	const name = useMemo(
		() =>
			generatePresetName(activeSettings, autoGeneratorOptions, {
				captureFormats,
				captureIndex,
			}),
		[autoGeneratorOptions, activeSettings, captureFormats, captureIndex],
	);

	useEffect(() =>
	{
		setAutoGenerateName(name);
		const array = Object.keys(autoGeneratorOptions).filter(
			(key) => autoGeneratorOptions[key],
		);
		setArrayList(array);
	}, [name, setAutoGenerateName]);

	if (!open) return null;

	return (
		<EkosModal onClose={close}>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					alignItems: "center",
					justifyContent: "center",
					rowGap: "1.5rem",
					columnGap: "1rem",
				}}
			>
				{Object.entries(autoGeneratingPresetOptions).map(([key, option]) =>
				{
					return (
						<FormCheckbox
							key={key}
							label={option.label}
							checked={autoGeneratorOptions[option.key] ?? option.defaultValue}
							onChange={onOptionChange(option.key, key)}
						/>
					);
				})}

				<Typography
					textAlign="Center"
					sx={{ gridColumn: "1 / 3", fontSize: "1.5rem" }}
				>
					{s.general.preset} {autoGenerateName}
				</Typography>
			</Box>
		</EkosModal>
	);
};

export default PresetGeneratorModal;
