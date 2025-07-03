import React, { useState } from "react";
import { Typography, Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { get, isEmpty } from "lodash";
import { useDispatch, useSelector } from "react-redux";
import { profileActions } from "@redux/actions";
import { selectEkosScopes, selectDslrLenses } from "@redux/selectors";
import { ScopeLensType } from "../../helpers/common";
import AlertDialog from "../../Components/AlertDialog";
import ScopeLensEditor from "./ScopeLensEditor";
import CloseButton from "../../Components/CloseButton";
import { Palette } from "@common/shared/common/styles";
import s from "@common/shared/i18n/i18n";

const ScopeLens = ({ toggleScopeLens }) =>
{
	const dispatch = useDispatch();

	const scopes = useSelector(selectEkosScopes);
	const dslrLenses = useSelector(selectDslrLenses);

	const [state, setState] = useState({
		show: false,
		type: "",
		showDialog: false,
		id: -1,
		new: false,
	});

	const [data, setData] = useState({
		vendor: "",
		model: "",
		type: "Recfactor",
		aperture: 50,
		focal_ratio: 2.8,
		focal_length: state.type === "scope" ? 500 : 24,
		id: -1,
	});

	const handleChange = (e, type) =>
	{
		if (type === ScopeLensType.vendor) setData({ ...data, vendor: e });
		else if (type === ScopeLensType.model) setData({ ...data, model: e });
		else if (type === ScopeLensType.type)
		{
			setData({ ...data, type: e.label });
		}
		else if (type === ScopeLensType.aperture)
			setData({ ...data, aperture: parseFloat(e) });
		else if (type === ScopeLensType.focalLength)
			setData({ ...data, focal_length: parseFloat(e) });
		else if (type === ScopeLensType.focalRatio)
			setData({ ...data, focal_ratio: parseFloat(e) });
	};

	const onEdit = (dslr, type) =>
	{
		if (type === "scope")
		{
			setData({
				...data,
				vendor: dslr.vendor,
				model: dslr.model,
				type: dslr.type,
				aperture: dslr.aperture,
				focal_length: dslr.focal_length,
				id: dslr.id,
			});
		}
		else
		{
			setData({
				...data,
				vendor: dslr.vendor,
				model: dslr.model,
				focal_ratio: dslr.focal_ratio,
				focal_length: dslr.focal_length,
				id: dslr.id,
			});
		}
		setState({ ...state, type: type, show: true });
	};

	const onAccept = (newScope) =>
	{
		if (state.type === "scope")
		{
			// If we already have a scope, let's update it.
			if (!isEmpty(scopes) && scopes.find((item) => item.id === newScope.id))
				dispatch(profileActions.updateScope(data));
			else dispatch(profileActions.addScope(data));
		}
		else
		{
			if (
				!isEmpty(dslrLenses) &&
				dslrLenses.find((item) => item.id === newScope.id)
			)
				dispatch(profileActions.updateDSLRLens(newScope));
			else dispatch(profileActions.addDSLRLens(newScope));
		}
		setState({ ...state, show: false });
	};

	const deleteScope = () =>
	{
		if (state.type === "scope")
		{
			dispatch(profileActions.deleteScope({ id: state.id }));
		}
		else
		{
			dispatch(profileActions.deleteDSLRLens({ id: state.id }));
		}
		setState({ ...state, showDialog: false });
	};

	if (state.show)
		return (
			<ScopeLensEditor
				open={state.show}
				onAccept={onAccept}
				data={data}
				isNew={state.new}
				handleChange={handleChange}
				mode={state.type}
				close={() => setState({ ...state, show: false })}
			/>
		);

	return (
		<>
			<Box sx={LOCAL_STYLES.modal}>
				<CloseButton
					right="-2%"
					top="-10%"
					onChange={() => toggleScopeLens(false)}
				/>
				<Box sx={[LOCAL_STYLES.gridList]}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography sx={{ color: "white" }}>
							{s.optical_train.telescope}
						</Typography>
						<IconButton
							onClick={() =>
							{
								setData({ data });
								setState({ ...state, show: true, type: "scope" });
							}}
							sx={[LOCAL_STYLES.iconButton]}
						>
							<AddIcon sx={{ color: "white", fontSize: 20 }} />
						</IconButton>
					</Box>
					{scopes.map((scope) =>
					{
						return (
							<Box sx={[LOCAL_STYLES.gridListItem]} key={scope.name}>
								<Typography
									style={{ color: "whitesmoke", width: "max-content" }}
								>
									{get(scope, "name", "null")}
								</Typography>
								<Box sx={[LOCAL_STYLES.buttonBox]}>
									<IconButton
										onClick={() =>
										{
											setState({ ...state, type: "scope" });
											onEdit(scope, "scope");
										}}
										sx={[
											LOCAL_STYLES.iconButton,
											{ backgroundColor: "#FFFCFA1A" },
										]}
									>
										<EditIcon sx={{ color: "white", fontSize: 20 }} />
									</IconButton>
									<IconButton
										onClick={() =>
											setState({
												...state,
												showDialog: true,
												type: "scope",
												id: scope.id,
											})
										}
										sx={[
											LOCAL_STYLES.iconButton,
											{ backgroundColor: Palette.red },
										]}
									>
										<DeleteIcon sx={{ color: "white", fontSize: 20 }} />
									</IconButton>
								</Box>
							</Box>
						);
					})}
				</Box>

				<Box sx={[LOCAL_STYLES.gridList]}>
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Typography sx={{ color: "white" }}>
							{s.optical_train.dslr_lens}
						</Typography>
						<IconButton
							onClick={() =>
							{
								setData({ data });
								setState({ ...state, show: true, new: true, type: "lens" });
							}}
							sx={[LOCAL_STYLES.iconButton]}
						>
							<AddIcon sx={{ color: "white", fontSize: 20 }} />
						</IconButton>
					</Box>
					{dslrLenses.map((dslr) =>
					{
						return (
							<Box sx={[LOCAL_STYLES.gridListItem]} key={dslr.name}>
								<Typography
									style={{ color: "whitesmoke", width: "max-content" }}
								>
									{get(dslr, "name", "null")}
								</Typography>
								<Box sx={[LOCAL_STYLES.buttonBox]}>
									<IconButton
										onClick={() =>
										{
											setState({ ...state, type: "lens" });
											onEdit(dslr, "lens");
										}}
										sx={[
											LOCAL_STYLES.iconButton,
											{ backgroundColor: "#FFFCFA1A" },
										]}
									>
										<EditIcon sx={{ color: "white", fontSize: 25 }} />
									</IconButton>
									<IconButton
										onClick={() =>
											setState({
												...state,
												showDialog: true,
												type: "lens",
												id: dslr.id,
											})
										}
										sx={[
											LOCAL_STYLES.iconButton,
											{ backgroundColor: Palette.red },
										]}
									>
										<DeleteIcon sx={{ color: "white", fontSize: 25 }} />
									</IconButton>
								</Box>
							</Box>
						);
					})}
				</Box>
			</Box>
			<AlertDialog
				handleDelete={deleteScope}
				show={state.showDialog}
				close={() => setState({ ...state, showDialog: false })}
				title="Confirmation"
				description="Are you sure you want to delete selected Lens?"
			/>
		</>
	);
};

const LOCAL_STYLES = {
	modal: {
		borderRadius: 2,
		backgroundColor: "#151515",
		border: "1px solid #252525",
		padding: "18px",
		position: "absolute",
		top: "70px",
		left: "50%",
		transform: "translateX(-50%)",
		zIndex: 10,
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "center",
		gap: "64px",
	},
	iconButton: {
		width: "35px",
		height: "35px",
		minWidth: "auto",
		padding: 0,
		backgroundColor: Palette.orange,
		borderRadius: "4px",
	},
	gridList: {
		display: "grid",
		gridTemplateRows: "60px auto",
		gap: "12px",
		minWidth: "320px",
	},
	buttonBox: {
		display: "flex",
		flexDirection: "row",
		gap: "6px",
		justifyContent: "center",
	},
	gridListItem: {
		display: "flex",
		flexDirection: "row",
		justifyContent: "space-between",
		gap: "12px",
	},
};

export default ScopeLens;
