import React, { useState } from "react";
import { get } from "lodash";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import XMLDialog from "../../../views/StellaPage/XMLDialog";
import { headCells } from "./FeedbackTableHead";
import { Palette } from "@common/shared/common/styles";

const FeedbackMessage = ({ feedback }) =>
{
	const [xml, setXml] = useState("");

	const getRowStyle = (isRunning) => ({
		backgroundColor: isRunning ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
	});

	return (
		<>
			<TableRow 
				role="cell" 
				tabIndex={-1} 
				hover
				sx={getRowStyle(feedback.ekosRunning)}
			>
				{headCells.map((header, idx) =>
				{
					let value = get(feedback, header.path, "");
					if (typeof value === "boolean") value = value.toString();
					if (header.title === "sequence")
						return (
							<TableCell key={idx} sx={{ color: Palette.white }}>
								{value ? (
									<IconButton
										sx={[
											{
												color: "#FFFFFF",
												textTransform: "none",
												borderRadius: "4px",
												height: "30px",
												width: "30px",
												padding: 0,
												backgroundColor: "#FFFCFA1F",
											},
										]}
										onClick={() => setXml(feedback.sequence)}
									>
										<LibraryBooksIcon
											sx={{ color: Palette.white, fontSize: 20 }}
										/>
									</IconButton>
								) : (
									"N/A"
								)}
							</TableCell>
						);

					if (header.title === "scheduler")
						return (
							<TableCell key={idx} sx={{ color: Palette.white }}>
								{value ? (
									<IconButton
										sx={[
											{
												color: "#FFFFFF",
												textTransform: "none",
												borderRadius: "4px",
												height: "30px",
												width: "30px",
												padding: 0,
												backgroundColor: "#FFFCFA1F",
											},
										]}
										onClick={() => setXml(feedback.scheduler)}
									>
										<PendingActionsIcon
											sx={{ color: Palette.white, fontSize: 20 }}
										/>
									</IconButton>
								) : (
									"N/A"
								)}
							</TableCell>
						);
					return (
						<TableCell
							sx={{
								padding: "8px",
								border: "1px solid #FFFCFA1F",
								color: Palette.white,
							}}
							key={idx}
							align="right"
						>
							{value ? (header.format ? header.format(value) : value) : "N/A"}
						</TableCell>
					);
				})}
			</TableRow>
			{xml && <XMLDialog xml={xml} onClose={() => setXml("")} />}
		</>
	);
};

export default FeedbackMessage;
