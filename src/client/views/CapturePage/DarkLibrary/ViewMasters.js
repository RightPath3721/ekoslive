import React, { useEffect, useState } from "react";
import { get, isEmpty } from "lodash";
import { Button, IconButton, Typography, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useDispatch, useSelector } from "react-redux";
import { captureActions } from "@redux/actions";
import { styles } from "../../../shared/styles";
import { selectDarkLibraryTableData, selectMetadata } from "@redux/selectors";
import defaultImg from "@images/background.webp";
import Icon from "@components/Icon";

const ViewMasters = () =>
{
	const dispatch = useDispatch();
	const tableData = useSelector(selectDarkLibraryTableData);
	const metadata = useSelector(selectMetadata);

	const [showControls, setShowControls] = useState(true);
	const [imageData, setImageData] = useState(defaultImg);

	const clearRow = (index) =>
	{
		let data = {
			row: index,
		};
		dispatch(captureActions.darkLibraryClearMasterRow(data));
	};

	const ArrowStyles = showControls
		? { right: 0, top: "15rem" }
		: { left: 0, top: "20rem" };

	const ArrowButton = () => (
		<Box sx={[ArrowStyles, { position: "absolute", display: "flex" }]}>
			<Button
				onClick={() => setShowControls(!showControls)}
				sx={{ height: "50px" }}
			>
				<Icon name="arrow-right" />
			</Button>
		</Box>
	);

	useEffect(() =>
	{
		dispatch(captureActions.darkLibrarySetDefectFrame());
		dispatch(captureActions.darkLibraryGetViewMasters());
		if (!isEmpty(tableData))
		{
			tableData.map((rows, index) =>
			{
				if (index === 0)
				{
					let data = {
						row: index,
					};
					dispatch(captureActions.darkLibraryGetMastersImage(data));
				}
			});
		}
	}, []);

	useEffect(() =>
	{
		if (!isEmpty(metadata))
		{
			if (get(metadata, "uuid", "") === "+D")
			{
				setImageData(metadata.preview + "?ts=" + new Date());
			}
		}
	}, [metadata]);

	if (isEmpty(tableData)) return null;

	return (
		<Box>
			{showControls && (
				<Box
					sx={{
						position: "absolute",
						backgroundColor: "rgba(0,0,0,0.7)",
						height: "80%",
						overflow: "scroll",
					}}
				>
					{tableData.map((item, index) => (
						<Box
							key={item.ts}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "flex-start",
								padding: "16px",
							}}
						>
							<Button
								onClick={() =>
								{
									let data = {
										row: index,
									};
									dispatch(captureActions.darkLibraryGetMastersImage(data));
								}}
								sx={{ display: "flex", gap: "10px" }}
							>
								<Typography sx={[styles.text]}>{index + 1}</Typography>
								<Typography sx={[styles.text, { width: "300px" }]}>
									{get(item, "temperature") >= -100 &&
									get(item, "temperature") <= 100 ? (
										<>
											{item.binX}x{item.binY} {item?.temperature.toFixed(1)}°C{" "}
											{item.duaration}s {item.ts}
										</>
									) : (
										<>
											{index + 1} {"    "}
											{get(item, "binX")}x{get(item, "binY")}{" "}
											{get(item, "duaration")}s {get(item, "ts")}
										</>
									)}
								</Typography>
							</Button>

							<IconButton
								onClick={() =>
								{
									clearRow(index);
									dispatch(captureActions.darkLibraryGetViewMasters());
								}}
								sx={{
									width: "36px",
									height: "36px",
									minWidth: "auto",
									padding: 0,
									backgroundColor: "#FFFCFA1A",
									borderRadius: "4px",
								}}
							>
								<DeleteIcon sx={{ color: "#CECECE", fontSize: 20 }} />
							</IconButton>
						</Box>
					))}
					<ArrowButton />
				</Box>
			)}
			<img style={LOCAL_STYLES.image} src={imageData} />

			{!showControls && <ArrowButton />}
		</Box>
	);
};

export default ViewMasters;

const LOCAL_STYLES = {
	image: {
		objectFit: "contain",
		width: "80%",
		height: "80%",
		maxHeight: "calc(100vh - 280px)",
	},
};
