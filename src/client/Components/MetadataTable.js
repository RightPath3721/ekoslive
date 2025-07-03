import React, { useEffect, useState } from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Modal from "@mui/material/Modal";
import { styles } from "../shared/styles";
import InputField from "./InputField";
import s from "@common/shared/i18n/i18n";
import { useTheme } from "@mui/system";

const MetadataTable = ({ metadata, onClose, open, containerStyles = {} }) =>
{
	const [tableData, setTableData] = useState(Object.entries(metadata));
	const [filter, setFilter] = useState("");
	const { palette } = useTheme();

	useEffect(() =>
	{
		setTableData(
			Object.entries(metadata).filter(([key]) =>
				key.toLowerCase().includes(filter.trim().toLowerCase()),
			),
		);
	}, [filter]);

	useEffect(() =>
	{
		setTableData(Object.entries(metadata));
	}, [metadata]);

	return (
		<Modal open={open} onClose={onClose} aria-labelledby="metadata-preview">
			<TableContainer
				component={Paper}
				sx={[
					styles.centerAbsolute,
					styles.verticalScrollBar,
					LOCAL_STYLES.container,
					{
						padding: "8px",
						height: "500px",
						overflowY: "scroll",
						containerStyles,
					},
				]}
			>
				<InputField
					clear={() => setFilter("")}
					value={filter}
					onChange={(value) => setFilter(value)}
					placeholder={s.general.search}
				/>
				<Table aria-label="metadata table" sx={{ marginTop: "12px" }}>
					<TableBody>
						{tableData.map(([key, value]) =>
						{
							return (
								<TableRow key={key}>
									<TableCell
										sx={{
											padding: "8px",
											whiteSpace: "nowrap",
											border: "1px solid #FFFCFA1F",
											color: palette.white[900],
											width: "100px",
										}}
										align="left"
										variant="head"
									>
										{key}
									</TableCell>
									<TableCell
										sx={{
											padding: "8px",
											border: "1px solid #FFFCFA1F",
											color: palette.white[900],
											maxWidth: "100px",
											whiteSpace: "nowrap",
											textOverflow: "ellipsis",
											overflow: "hidden",
										}}
									>
										{value}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</Modal>
	);
};

const LOCAL_STYLES = {
	container: {
		backgroundColor: "#222222",
		maxWidth: "600px",
		overflowX: "scroll",
	},
};

export default MetadataTable;
