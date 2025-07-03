import React, { useState, useCallback, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Popover,
	Typography,
	Tooltip,
	Avatar,
} from "@mui/material";
import { toast } from "react-toastify";
import EditIcon from "@mui/icons-material/Edit";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UploadForm from "@components/UploadPostForm";
import ModelModal from "../Equipment/Manufacturer/ModelModal";
import ManufacturerModal from "../Equipment/ManufacturerModal";
import s from "@common/shared/i18n/i18n";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";
import { useTheme } from "@mui/system";
import Image from "mui-image";
import Moment from "react-moment";
import AddObservatoryForm from "@client/views/Setup/EkosInstanceSelector/AddObservatoryForm";
import AlertDialog from "@components/AlertDialog";
import { nameConvertorForURL } from "@client/utils/nameConvertorForURL";
import { captureException } from "@sentry/browser";

const ModerationTable = ({ columns, posts, setPosts, mode = "post", fetchPendingTasks }) =>
{
	const { palette } = useTheme();
	const user = useSelector(selectUser);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editData, setEditData] = useState();
	const [anchorEl, setAnchorEl] = useState(null);
	const [hoveredRowData, setHoveredRowData] = useState(null);

	const [openApproveModal, setOpenApproveModal] = useState(false);
	const [openRejectModal, setOpenRejectModal] = useState(false);
	const [selectedRow, setSelectedRow] = useState(null);
	const [equipmentType, setEquipmentType] = useState("");
	const navigate = useNavigate();

	// Open the quick preview
	const handlePopoverOpen = (event, row) =>
	{
		setAnchorEl(event.currentTarget);
		setHoveredRowData(row);
	};

	// Close the quick preview
	const handlePopoverClose = () =>
	{
		setAnchorEl(null);
		setHoveredRowData(null);
	};

	// Open the approve confirm model
	const handleOpenApproveModal = (row) =>
	{
		setSelectedRow(row);
		setOpenApproveModal(true);
	};

	// Close the approve confirm model
	const handleCloseApproveModal = () =>
	{
		setOpenApproveModal(false);
		setSelectedRow(null);
	};

	// Open the reject confirm modal
	const handleOpenRejectModal = (row) =>
	{
		setSelectedRow(row);
		setOpenRejectModal(true);
	};

	// Close the reject confirm modal
	const handleCloseRejectModal = () =>
	{
		setOpenRejectModal(false);
		setSelectedRow(null);
	};

	const goto = async (data) =>
	{
		
		navigate(
			`/community/equipment/${nameConvertorForURL(data.equipmentTypeName) + '-' + data.equipment_type}/${nameConvertorForURL(data.manufacturerName) + '-' + data.manufacturer}/${nameConvertorForURL(data.label) + '-' + data?._id}`
		);
	};

	/**
	 * Handle the approval of a selected row.
	 *
	 * @async
	 * @returns {Promise<void>} - A promise that resolves when the approval process is completed and the approval modal is closed.
	 */
	const handleApprove = async () =>
	{
		if (!user) return null;
		if (selectedRow)
		{
			const url = `/api/posts/approve/${selectedRow.moderation_report._id}/${mode}/${selectedRow._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const body = {
				action: "APPROVED",
			};
			const result = await ekosliveServer.post(url, body);
			if (result)
			{
				toast.success(s.general.success);
				const updatedDatas = posts.filter(
					(row) =>
						row.moderation_report._id !== selectedRow.moderation_report._id,
				);
				setPosts(updatedDatas);
				fetchPendingTasks();
			}
		}
		handleCloseApproveModal();
	};

	/**
	 * Handle the reject of a selected row.
	 *
	 * @async
	 * @returns {Promise<void>} - A promise that resolves when the reject process is completed and the approval modal is closed.
	 */
	const handleReject = async () =>
	{
		if (!user) return null;

		if (selectedRow)
		{
			const url = `/api/posts/approve/${selectedRow.moderation_report._id}/${mode}/${selectedRow._id}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const body = {
				action: "REJECTED",
			};
			const result = await ekosliveServer.post(url, body);
			if (result)
			{
				toast.success(s.general.success);
				const updatedDatas = posts.filter(
					(row) =>
						row.moderation_report._id !== selectedRow.moderation_report._id,
				);
				setPosts(updatedDatas);
				fetchPendingTasks();
			}
		}
		handleCloseRejectModal();
	};

	const truncateString = (str, maxLength = 20, suffix = '...') => 
	{
		if (typeof str === "string") {
			if (str.length > maxLength) {
			  return str.slice(0, maxLength - suffix.length) + suffix;
			}
			return str;
		}
		return str;
	}

	const fetchEquipmentType = async (equipmentTypeId) =>
	{
		try
		{
			const url = `/api/equipments/equipment-types/${equipmentTypeId}`;
			const response = await ekosliveServer.get(url);
			setEquipmentType(response.data.equipmentType);
		}
		catch (error)
		{
			captureException(error);
		}
	};

	useEffect(() => {
		if(editData?.equipment_type) {
			fetchEquipmentType(editData.equipment_type)
		}
	}, [editData])

	/**
	 * Handles the change event for pagination page change.
	 *
	 * @param {object} event - The event object triggering the page change.
	 * @param {number} newPage - The new page number to set.
	 */
	const handleChangePage = (event, newPage) =>
	{
		setPage(newPage);
	};

	/**
	 * Handles the edit action by displaying the edit modal and setting the current data to be edited.
	 *
	 * @param {object} data - The data object to be edited.
	 */
	const handleEdit = (data) =>
	{
		setShowEditModal(true);
		setEditData(data);
	};

	/**
	 * Handles the change event for changing the number of rows per page.
	 *
	 * @param {object} event - The event object triggering the change in rows per page.
	 */
	const handleChangeRowsPerPage = (event) =>
	{
		setRowsPerPage(+event.target.value);
		setPage(0);
	};

	/**
	 * Handles the submission of a new post upload.
	 */
	const onUploadSubmit = useCallback(
		(post) =>
		{
			if (post._id)
			{
				setPosts((prev) => [post, ...prev]);
			}
		},
		[setPosts],
	);

	return (
		<Paper sx={{ width: "100%", overflow: "hidden" }}>
			<TableContainer>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell></TableCell>
							{columns.map((column) => (
								<TableCell
									key={column.id}
									align={column.align}
									style={{ minWidth: column.minWidth }}
									sx={{
										color: "#ff6600",
										textAlign:
											column.label === s.general.action ? "center" : "left",
									}}
								>
									{column.label}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody sx={{ color: palette.white[900] }}>
						{posts?.length === 0 || !posts ? (
							<TableRow sx={{ bgcolor: "#2b2a2a", color: palette.white[900] }}>
								<TableCell
									sx={{ color: palette.white[900] }}
									colSpan={columns.length + 1}
									align="center"
								>
									{s.general.no_data_found}
								</TableCell>
							</TableRow>
						) : (
							posts
								?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
								.map((row) => (
									<TableRow
										hover
										role="checkbox"
										tabIndex={-1}
										key={row._id || row.moderation_report?._id || `row-${Math.random()}`}
										sx={{ bgcolor: "#2b2a2a", color: palette.white[900] }}
									>
										<TableCell>
											<Image
												src={row.image?.preview || row.logo || row.photos?.[0] || "/public/manufacturer-logo.png"}
												sx={{width: "100px !important"}}
											/>
										</TableCell>
										{columns.map((column) =>
											{
											const value =
												row[column.id] ||
												(row.moderating_status
													? row.moderating_status[column.id]
													: "") ||
												(row.posted_by ? row.posted_by[column.id] : "");

											const isClickableColumn = ["title", "name", "label", "manufacturerName"].includes(column.id);
											return (
												<TableCell
													sx={{
														color: isClickableColumn ? palette.primary.main : palette.white[900],
														cursor: isClickableColumn ? "pointer" : "default"
													}}
													key={column.id}
													align={column.align}
													onClick={
														["title", "name", "label"].includes(column.id)
															? (e) => handlePopoverOpen(e, row)
															: column.id === "manufacturerName" ? () => goto(row) 
															: null
													}
												>
													{column.id === "createdAt" ? (
														<Moment format="YYYY.MM.DD HH:mm">
															{row[column.id]}
														</Moment>
													): column.id === "full_name" ? (
														<Box sx={{display: "flex", flexDirection: "column"}}>
															<Avatar
																src={row.posted_by?.avatar || "/public/profile_default_image.webp"}
															>
															</Avatar>
															{row.posted_by?.[column.id] ? row.posted_by[column.id] : "Web Scraper"}
														</Box>
													): column.id === "action" ? (
														<Box
															sx={{
																display: "flex",
																flexDirection: "row",
																justifyContent: "space-between",
															}}
														>
															<Tooltip title="Edit">
																<EditIcon
																	color="primary"
																	onClick={() => handleEdit(row)}
																/>
															</Tooltip>
															<Tooltip title="Approve">
																<CheckCircleOutlineIcon
																	color="success"
																	onClick={() => handleOpenApproveModal(row)}
																/>
															</Tooltip>
															<Tooltip title="Reject">
																<DoDisturbIcon
																	color="error"
																	onClick={() => handleOpenRejectModal(row)}
																/>
															</Tooltip>
														</Box>
													) : (
														truncateString(value)
													)}
												</TableCell>
											);
										})}
									</TableRow>
								))
						)}
					</TableBody>
				</Table>
			</TableContainer>
			<TablePagination
				sx={{ 
					color: palette.primary.main,
					"& .MuiTablePagination-selectIcon": {
						color: palette.white[900],
					},
				}}
				rowsPerPageOptions={[10, 25, 100]}
				component="div"
				count={posts?.length}
				rowsPerPage={rowsPerPage}
				page={page}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleChangeRowsPerPage}
			/>

			{mode === "post" ? (
				<UploadForm
					close={() => setShowEditModal(false)}
					open={showEditModal}
					id={editData?._id}
					submit={onUploadSubmit}
					mode={editData?._id ? "edit" : "add"}
				/>
			) : (
				<>
					{
						mode === "manufacturer" && 
						<ManufacturerModal
							handleClose={() => setShowEditModal(false)}
							open={showEditModal}
							editData={editData}
							setManufacturers={setPosts}
						/>
					}
					{
						mode === "model" &&
						<ModelModal
							handleClose={() => setShowEditModal(false)}
							open={showEditModal}
							editData={editData}
							fields={equipmentType?.fields}
							setEquipmentModels={setPosts}
						/>
					}
					{
						mode === "observatory" &&
						<AddObservatoryForm
							close={() => setShowEditModal(false)}
							open={showEditModal}
							editData={editData}
						/>
					}
				</>
			)}

			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={handlePopoverClose}
				anchorOrigin={{
					vertical: "top",
					horizontal: "right",
				}}
				transformOrigin={{
					vertical: "top",
					horizontal: "left",
				}}
			>
				<Paper
					sx={{ padding: 2, bgcolor: "#2b2a2a", color: palette.white[900] }}
				>
					{hoveredRowData && (
						<>
							<Typography variant="h6">
								{hoveredRowData.title ||
									hoveredRowData.name ||
									hoveredRowData.label}
							</Typography>
							<img
								src={hoveredRowData.image?.preview || hoveredRowData.logo || hoveredRowData.photos?.[0] || "/public/manufacturer-logo.png"}
								style={{ width: "100px" }}
								alt="preview"
							/>
							<Typography variant="body2">
								{hoveredRowData.description || hoveredRowData.url}
							</Typography>
						</>
					)}
				</Paper>
			</Popover>

			<AlertDialog
				show={openApproveModal}
				close={handleCloseApproveModal}
				handleDelete={handleApprove}
				title={s.general.confirm_approve}
				description={`Are you sure to approve this?`}
				yes={true}
				type={"info"}
				icon={<CheckCircleOutlineIcon color="success"/>}
			/>

			<AlertDialog
				show={openRejectModal}
				close={handleCloseRejectModal}
				handleDelete={handleReject}
				title={s.general.confirm_reject}
				description={`Are you sure to reject this?`}
				yes={true}
				icon={<DoDisturbIcon color="error"/>}
			/>
		</Paper>
	);
};

export default memo(ModerationTable);
