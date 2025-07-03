import React, { memo, useEffect, useState } from "react";
import isEmpty from "lodash/isEmpty";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ReplayIcon from "@mui/icons-material/Replay";
import DensitySmallIcon from "@mui/icons-material/DensitySmall";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";
import FormCheckbox from "@components/FormCheckbox";

const fileDefaultFormat = ["%t", "%T", "%F"];
const Formats = [
	{ text: "Type", placeholder: "%T", checked: true },
	{ text: "Exposure", placeholder: "%e", checked: false },
	{ text: "Exp", placeholder: "%E", checked: false },
	{ text: "Filter", placeholder: "%F", checked: true },
	{ text: "Target", placeholder: "%t", checked: true },
	{ text: "Temperature", placeholder: "%C", checked: false },
	{ text: "Binning", placeholder: "%B", checked: false },
	{ text: "Gain", placeholder: "%G", checked: false },
	{ text: "Offset", placeholder: "%O", checked: false },
	{ text: "ISO", placeholder: "%I", checked: false },
	{ text: "Filename", placeholder: "%f", checked: false },
	{ text: "Datetime", placeholder: "%D", checked: false },
];

const LOCAL_STYLES = {
	imageButton: { width: "40px", height: "40px", minWidth: "auto", padding: 0 },
};

/**
 * Format Settings.
 * @param {*} format - Current Format.
 * @param {*} preview - Format preview string.
 * @param {*} setPreview - Set New Preview.
 * @returns {JSX.Element}
 */
const FormatSettings = ({ format, preview, setPreview }) =>
{
	const [formats, setFormats] = useState(Formats);
	const [filePlaceholder, setFilePlaceholder] = useState();
	const [prefix, setPrefix] = useState();

	const toggleCheckbox = (id) =>
	{
		setFormats(
			formats.map((oneFormat, index) =>
				id === index
					? { ...oneFormat, checked: !oneFormat.checked }
					: oneFormat,
			),
		);
	};

	const generateFilePlaceholder = () =>
	{
		const placeholders = formats.map((oneFormat) =>
			oneFormat.checked ? oneFormat.placeholder : "",
		);
		const newPlaceholderFormat = placeholders.filter(Boolean).join("_");
		if (!isEmpty(newPlaceholderFormat))
			setFilePlaceholder(newPlaceholderFormat);
	};

	const resetToDefaultFormat = () =>
	{
		setFormats(
			formats.map((oneFormat) => ({
				...oneFormat,
				checked: fileDefaultFormat.includes(oneFormat.placeholder),
			})),
		);
	};

	const clearAllFormat = () =>
	{
		setFormats(formats.map((oneFormat) => ({ ...oneFormat, checked: false })));
	};

	useEffect(() =>
	{
		if (!isEmpty(filePlaceholder)) setPreview(prefix + filePlaceholder);
	}, [filePlaceholder]);

	useEffect(() =>
	{
		if (!isEmpty(prefix)) generateFilePlaceholder();
	}, [formats]);

	useEffect(() =>
	{
		const lastSlash = format.lastIndexOf("/");
		if (lastSlash === -1) return;

		setPrefix(format.substring(0, lastSlash + 1));
		const postfix = format.substring(lastSlash + 1);
		if (!isEmpty(postfix))
		{
			const placeholders = postfix.split("_");
			const newFormats = formats.map((oneFormat) => ({
				...oneFormat,
				checked: placeholders.includes(oneFormat.placeholder),
			}));

			setFormats(newFormats);
		}
	}, []);

	return (
		<Box>
			<Box sx={{ display: "flex" }}>
				<Box display="flex" flexWrap="wrap">
					<Typography sx={{ width: "100%" }}>
						{s.general.format} {s.settings.heading}
					</Typography>
					{formats.map((item, index) => (
						<Box key={index} width="50%">
							<FormControlLabel
								control={
									<FormCheckbox
										checked={formats[index].checked}
										onChange={() => toggleCheckbox(index)}
									/>
								}
								label={item.text}
							/>
						</Box>
					))}
					<Typography variant="h6" style={{ marginTop: 20 }}>
						{s.tourGuide.title_preview}: {preview || "--"}
					</Typography>
				</Box>

				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: "8px",
						marginTop: "16px",
					}}
				>
					<IconButton
						onClick={resetToDefaultFormat}
						sx={[
							LOCAL_STYLES.imageButton,
							{ backgroundColor: "#0994C8", borderRadius: "4px" },
						]}
					>
						<ReplayIcon sx={{ color: "#CECECE", fontSize: 25 }} />
					</IconButton>
					<IconButton
						onClick={clearAllFormat}
						sx={[
							LOCAL_STYLES.imageButton,
							{ backgroundColor: Palette.error, borderRadius: "4px" },
						]}
					>
						<DensitySmallIcon sx={{ color: "#CECECE", fontSize: 25 }} />
					</IconButton>
				</Box>
			</Box>
		</Box>
	);
};

export default memo(FormatSettings);
