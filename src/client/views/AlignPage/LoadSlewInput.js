import React, { useState } from "react";
import Box from "@mui/material/Box";
import { useDispatch } from "react-redux";
import { alignActions, mountActions } from "@redux/actions";
import { styles } from "../../shared/styles";
import s from "@common/shared/i18n/i18n";

const LoadSlewInput = () =>
{
	const dispatch = useDispatch();
	const [filename, setFilename] = useState("");

	const loadAndSlew = async (file) =>
	{
		try
		{
			// takes image loaded through handleChoosePhoto() and sends it to ekos as a binary
			// ArrayBuffer that has the extension (.jpg .png) in the first 128 bytes and the image in the rest.
			dispatch(mountActions.unpark());
			dispatch(alignActions.loadAndSlew(file));
			setFilename("");
		}
		catch (error)
		{
			console.error(error);
		}
	};

	const handleChange = (e) =>
	{
		const file = e.target.files[0];
		if (!file) return;

		loadAndSlew(file);
		setFilename(file.name);
	};

	return (
		<Box
			sx={[
				styles.row,
				{
					justifyContent: "space-between",
					width: "100%",
					height: "43px",
					gap: "12px",
				},
			]}
		>
			<label
				style={{
					display: "grid",
					placeItems: "center",
					color: "#FFFFFF",
					textTransform: "none",
					flex: 1,
					border: "1px solid #2d2d2d",
					backgroundColor: "#1e1e1e",
					fontSize: "14px",
					fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
					fontWeight: 500,
					borderRadius: "4px",
				}}
			>
				{filename ? filename : s.ekos.collapse_align.load}
				<input
					type="file"
					onChange={handleChange}
					accept="image/png, image/jpg"
					hidden
				/>
			</label>
		</Box>
	);
};

export default LoadSlewInput;
