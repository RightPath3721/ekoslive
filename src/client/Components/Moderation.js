import React, { memo, useState } from "react";
import "cropperjs/dist/cropper.css";
import { Box, Button } from "@mui/material";
import s from "@common/shared/i18n/i18n";
import { SubmissionStatus } from "@utils/status";
import FormLabelTextField from "./FormLabelTextField";
import DropSearchableDown from "./DropSearchableDown";
import TagsView from "./TagsView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import DeleteIcon from "@mui/icons-material/Delete";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

const Moderation = ({
	submissionStatus,
	setSubmissionStatus,
	tags,
	setTags,
	note,
	setNote,
	reportData,
	handleOpenDeleteModal,
	handleOpenBanModal,
}) =>
{
	const handleTagChange = (event, newValue) =>
	{
		setTags(newValue);
	};

	const [isCollapsed, setIsCollapsed] = useState(true);

	const toggleCollapse = () =>
	{
		setIsCollapsed(!isCollapsed);
	};

	return (
		<>
			{handleOpenBanModal && handleOpenDeleteModal && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "row",
						width: "100%",
						gap: "10px",
					}}
				>
					<Button
						variant="outlined"
						startIcon={<DeleteIcon sx={{ color: "red" }} />}
						sx={{ width: "50%", color: "red" }}
						onClick={() => handleOpenDeleteModal(reportData)}
					>
						{s.general.delete}
					</Button>
					<Button
						variant="outlined"
						startIcon={<RemoveCircleOutlineIcon sx={{ color: "red" }} />}
						sx={{ color: "red", width: "50%" }}
						onClick={() => handleOpenBanModal(reportData)}
					>
						{s.general.ban}
					</Button>
				</Box>
			)}
			<Box sx={{ position: "relative", width: "100%", mb: "30px" }}>
				<Button
					endIcon={isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
					onClick={toggleCollapse}
					sx={{ alignSelf: "flex-end", position: "absolute", right: 0 }}
				>
					{s.menu.go_to_moderation}
				</Button>

				{!isCollapsed && (
					<Box
						sx={[
							{
								display: "flex",
								flexDirection: "column",
								borderRadius: "16px",
								backgroundColor: "#272727",
								border: "1px solid #FFFCFA1F",
								padding: "16px",
								width: "100%",
								alignContent: "space-between",
							},
						]}
					>
						<Box
							sx={{
								display: "flex",
								flexDirection: "row",
								gap: "20px",
								width: "100%",
							}}
						>
							<DropSearchableDown
								label={"Status"}
								options={SubmissionStatus}
								value={submissionStatus}
								handleChange={(key, value) => setSubmissionStatus(value)}
								sx={{ width: "33%" }}
							/>
							<FormLabelTextField
								label="Note"
								value={note}
								onChange={(e) => setNote(e.target.value)}
								width="33%"
							/>
							<TagsView
								label="Tags"
								options={[]}
								value={tags}
								onChange={handleTagChange}
								sx={{ width: "33%" }}
							/>
						</Box>
					</Box>
				)}
			</Box>
		</>
	);
};

export default memo(Moderation);
