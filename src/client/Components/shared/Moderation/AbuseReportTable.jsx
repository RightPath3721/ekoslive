import React, { useState, useCallback, useEffect, memo } from "react";
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
	Tooltip,
	Avatar
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import UploadForm from "@components/UploadPostForm";
import s from "@common/shared/i18n/i18n";
import { useSelector } from "react-redux";
import { selectUser } from "@redux/selectors";
import { ekosliveServer } from "@client/config";
import ConfirmModal from "@components/ConfirmModal";
import CommentEditModal from "./CommentEditModal";
import { toast } from "react-toastify";
import { useTheme } from "@mui/system";
import ModelModal from "../Equipment/Manufacturer/ModelModal";
import { captureException } from "@sentry/browser";
import Moment from "react-moment";
import AlertDialog from "@components/AlertDialog";

const columns = [
	{ id: "type", label: "Type", minWidth: 100 },
	{ id: "reason", label: "Reason", minWidth: 30 },
	{ id: "comment", label: "Comment", minWidth: 30 },
	{ id: "full_name", label: s.general.submitted_by, minWidth: 30 },
	{ id: "createdAt", label: s.general.submitted_date, minWidth: 30 },
	{ id: "action", label: s.general.action, minWidth: 100 },
];

const AbuseReportTable = ({ posts, setPosts, fetchPendingTasks }) =>
{
	const { palette } = useTheme();
	const user = useSelector(selectUser);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [showEditModal, setShowEditModal] = useState(false);
	const [editData, setEditData] = useState();

	const [openDeleteModal, setOpenDeleteModal] = useState(false);
	const [openApproveModal, setOpenApproveModal] = useState(false);
	const [openIgnoreModal, setOpenIgnoreModal] = useState(false);
	const [openBanModal, setOpenBanModal] = useState(false);
	const [selectedRow, setSelectedRow] = useState(null);
	const [equipmentModel, setEquipmentModel] = useState({});
	const [comment, setComment] = useState({});
	const [equipmentType, setEquipmentType] = useState("");
	const [owner, setOwner] = useState("");

	// Open the delete confirm model
	const handleOpenDeleteModal = (row) =>
	{
		setSelectedRow(row);
		setOpenDeleteModal(true);
	};

	// Open the delete confirm model
	const handleOpenApproveModal = (row) =>
	{
		setSelectedRow(row);
		setOpenApproveModal(true);
	};

	// Close the delete confirm model
	const handleCloseDeleteModal = () =>
	{
		setOpenDeleteModal(false);
		setSelectedRow(null);
		setShowEditModal(false)
	};

	// Close the delete confirm model
	const handleCloseApproveModal = () =>
	{
		setOpenApproveModal(false);
		setSelectedRow(null);
	};

	// Open the ignore confirm modal
	const handleOpenIgnoreModal = (row) =>
	{
		setSelectedRow(row);
		setOpenIgnoreModal(true);
	};

	// Close the ignore confirm modal
	const handleCloseIgnoreModal = () =>
	{
		setOpenIgnoreModal(false);
		setSelectedRow(null);
	};

	// Open the ban confirm modal
	const handleOpenBanModal = (row) =>
	{
		setSelectedRow(row);
		setOpenBanModal(true);
	};

	// Close the ban confirm modal
	const handleCloseBanModal = () =>
	{
		setOpenBanModal(false);
		setSelectedRow(null);
		setShowEditModal(false)
	};

	/**
	 * Handle the delete resource.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the delete process is completed and the delete modal is closed.
	 * @async
	 */
	const handleDelete = async () =>
	{
		if (!user) return null;

		if (selectedRow)
		{
			const url = `/api/posts/abuse-report/delete?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const body = {
				id: selectedRow._id,
				resourceId: selectedRow.resource_id,
				type: selectedRow.type,
			};
			const result = await ekosliveServer.post(url, body);
			if (result)
			{
				toast.success(s.general.success);
				const updatedDatas = posts.filter((row) => row._id !== selectedRow._id);
				setPosts(updatedDatas);
				fetchPendingTasks();
			}
		}
		handleCloseDeleteModal();
	};

	/**
	 * Handle the ignore current report.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the ignore process is completed and the ignore modal is closed.
	 * @async
	 */
	const handleIgnore = async () =>
	{
		if (!user) return null;

		if (selectedRow)
		{
			const url = `/api/posts/abuse-report/ignore?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const body = {
				id: selectedRow._id,
			};
			const result = await ekosliveServer.post(url, body);
			if (result)
			{
				toast.success(s.general.success);
				const updatedDatas = posts.filter((row) => row._id !== selectedRow._id);
				setPosts(updatedDatas);
				fetchPendingTasks();
			}
		}
		handleCloseIgnoreModal();
	};

	const handleApprove = async () =>
	{
		if (!user) return null;

		if (selectedRow)
		{
			const url = `/api/posts/abuse-report/approve?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const body = {
				id: selectedRow._id,
			};
			const result = await ekosliveServer.post(url, body);
			if (result)
			{
				toast.success(s.general.success);
				const updatedDatas = posts.filter((row) => row._id !== selectedRow._id);
				setPosts(updatedDatas);
				fetchPendingTasks();
			}
		}
		handleCloseApproveModal();
	};

	/**
	 * Handle the ban onwer of current resource.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the ban process is completed and the ban modal is closed.
	 * @async
	 */
	const handleBan = async () =>
	{
		if (!user) return null;

		if (selectedRow)
		{
			const url = `/api/posts/abuse-report/ban?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const body = {
				id: selectedRow._id,
				resourceId: selectedRow.resource_id,
				type: selectedRow.type,
			};
			const result = await ekosliveServer.post(url, body);
			if (result)
			{
				toast.success(s.general.success);
				const updatedDatas = posts.filter((row) => row._id !== selectedRow._id);
				setPosts(updatedDatas);
				fetchPendingTasks();
			}
		}
		handleCloseBanModal();
	};

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
	 * Fetches equipment model details from the server.
	 *
	 * @returns {Promise<void>} A Promise that resolves when the equipment model details are fetched and set in the state.
	 * @async
	 */
	const fetchEquipmentModel = async (equipmentModelId) =>
	{
		try
		{
			const url = `/api/equipments/equipment-model/${equipmentModelId}`;
			const response = await ekosliveServer.get(url);
			setEquipmentModel(response.data.equipmentModel);
			setOwner(response.data.equipmentModel.posted_by?.full_name || "Web Scraper");
		}
		catch (error)
		{
			captureException(error);
		}
	};

	const fetchComment = async (commentId) =>
	{
		if (!user) return null;

		try
		{
			const url = `/api/comments/${commentId}?username=${encodeURIComponent(user.username)}&token=${user.token}`;
			const response = await ekosliveServer.get(url);
			setComment(response.data);
			setOwner(response.data.posted_by?.full_name);
		}
		catch (error)
		{
			captureException(error, { addAttachment: { commentId: commentId} });
		}
	};

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

	/**
	 * Handles the edit action by displaying the edit modal and setting the current data to be edited.
	 *
	 * @param {object} data - The data object to be edited.
	 */
	const handleEdit = async (data) =>
	{
		setShowEditModal(true);
		setEditData(data);
		if(data.type === "EQUIPMENTMODEL") {
			await fetchEquipmentModel(data.resource_id);
		} else if(data.type === "COMMENT") {
			await fetchComment(data.resource_id);
		};
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

	useEffect(() => {
		if(equipmentModel?.equipment_type) {
			fetchEquipmentType(equipmentModel.equipment_type)
		}
	}, [equipmentModel])

	return (
		<Paper sx={{ width: "100%", overflow: "hidden" }}>
			<TableContainer>
				<Table>
					<TableHead>
						<TableRow>
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
										key={row.name}
										sx={{ bgcolor: "#2b2a2a", color: palette.white[900] }}
									>
										{columns.map((column) =>
											{
											const value =
												row[column.id] ||
												(row.moderating_status
													? row.moderating_status[column.id]
													: "") ||
												(row.posted_by ? row.posted_by[column.id] : "");
											return (
												<TableCell
													sx={{
														color: ["title", "name", "label"].includes(
															column.id,
														)
															? "#ff6600"
															: palette.white[900],
													}}
													key={column.id}
													align={column.align}
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
																	sx={{ color: "#ff6600" }}
																	onClick={() => handleEdit(row)}
																/>
															</Tooltip>
															<Tooltip title="Approve">
																<CheckCircleOutlineIcon
																	color="success"
																	onClick={() => handleOpenApproveModal(row)}
																/>
															</Tooltip>
															<Tooltip title="Ignore">
																<DoDisturbIcon
																	sx={{ color: "red" }}
																	onClick={() => handleOpenIgnoreModal(row)}
																/>
															</Tooltip>
															
														</Box>
													) : (
														value === "EQUIPMENTMODEL" ? "MODEL" : value
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
				sx={{ color: "#ff6600" }}
				rowsPerPageOptions={[10, 25, 100]}
				component="div"
				count={posts?.length}
				rowsPerPage={rowsPerPage}
				page={page}
				onPageChange={handleChangePage}
				onRowsPerPageChange={handleChangeRowsPerPage}
			/>

			{editData?.type === "POST" ? (
				<UploadForm
					close={() => setShowEditModal(false)}
					open={showEditModal}
					id={editData?.resource_id}
					submit={onUploadSubmit}
					mode={editData?._id ? "edit" : "add"}
					reportData={editData}
					handleOpenDeleteModal={handleOpenDeleteModal}
					handleOpenBanModal={handleOpenBanModal}
					setOwner={setOwner}
				/>
			) : editData?.type === "COMMENT" ? (
				<CommentEditModal
					open={showEditModal}
					editData={comment}
					reportData={editData}
					handleClose={() => setShowEditModal(false)}
					handleOpenDeleteModal={handleOpenDeleteModal}
					handleOpenBanModal={handleOpenBanModal}
				/>
			) : editData?.type === "EQUIPMENTMODEL" ? (
				<ModelModal
					open={showEditModal}
					handleClose={() => setShowEditModal(false)}
					fields={equipmentType?.fields}
					editData={equipmentModel}
					reportData={editData}
					handleOpenDeleteModal={handleOpenDeleteModal}
					handleOpenBanModal={handleOpenBanModal}
				/>
			) : null}

			<AlertDialog
				show={openDeleteModal}
				close={handleCloseDeleteModal}
				handleDelete={handleDelete}
				title={s.general.confirm_delete}
				description={`Are you sure to delete this ${editData?.type === "EQUIPMENTMODEL" ? "MODEL" : editData?.type}?`}
				yes={true}
				icon={<DeleteOutlineIcon color="error"/>}
			/>

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
				show={openIgnoreModal}
				close={handleCloseIgnoreModal}
				handleDelete={handleIgnore}
				title={s.general.confirm_ignore}
				description={`Are you sure to delete this report?`}
				yes={true}
				icon={<DoDisturbIcon color="error"/>}
			/>

			<AlertDialog
				show={openBanModal}
				close={handleCloseBanModal}
				handleDelete={handleBan}
				title={s.general.confirm_ban}
				description={`Are you sure to ban ${owner}?`}
				yes={true}
				icon={<RemoveCircleOutlineIcon color="error"/>}
			/>
		</Paper>
	);
};

export default memo(AbuseReportTable);
