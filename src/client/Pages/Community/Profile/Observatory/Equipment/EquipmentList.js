import React, { useEffect, useState, memo } from "react";
import isEmpty from "lodash/isEmpty";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import EquipmentBox from "./EquipmentBox";
import Icon from "@components/Icon";
import EquipmentTypeOverlay from "./EquipmentTypeOverlay";
import ManufacturerOverlay from "./ManufacturerOverlay";
import EquipmentModelOverlay from "./EquipmenModelOverlay";
import { useEquipmentContext } from "./EquipmentContext";
import EmptyListTitle from "../EmptyListTitle";
import s from "@common/shared/i18n/i18n";
import ManufacturerModal from "@components/shared/Equipment/ManufacturerModal";
import ModelModal from "@components/shared/Equipment/Manufacturer/ModelModal";

const EquipmentList = ({ observatoryId, profileId }) =>
{
	const [equipmentFormData, setEquipmentFormData] = useState(null);
	const [equipmentModels, setEquipmentModels] = useState([]);
	const [manufacturers, setManufacturers] = useState([]);
	const [showEquipmentTypeOverlay, setShowEquipmentTypeOverlay] = useState(false);
	const [showManufacturerOverlay, setShowManufacturerOverlay] = useState(false);
	const [showEquipmentModelOverlay, setShowEquipmentModelOverlay] = useState(false);
	const [equipmentTypeId, setEquipmentTypeId] = useState("")
	const [manufacturerId, setManufacturerId] = useState("")
	const { equipmentList, setEquipmentList } = useEquipmentContext();

	const [showManufacturerModal, setShowManufacturerModal] = useState(false);
	const [showModelModal, setShowModelModal] = useState(false);

	useEffect(() => {
		if(equipmentTypeId) {
			setShowEquipmentTypeOverlay(false);
			setShowManufacturerOverlay(true);
			if(manufacturerId) {
				setShowManufacturerOverlay(false);
				setShowEquipmentModelOverlay(true);
			}
		}
	}, [equipmentTypeId, manufacturerId, showEquipmentTypeOverlay])

	useEffect(() => {
		if(!showManufacturerOverlay && !showEquipmentModelOverlay) {
			setEquipmentTypeId("");
			setManufacturerId("");
		};
	}, [showEquipmentTypeOverlay, showManufacturerOverlay, showEquipmentModelOverlay])

	return (
		<Box
			sx={{
				position: "relative",
				display: "grid",
				gridTemplateColumns: isEmpty(equipmentList) ? "1fr" : "repeat(2, 1fr)",
				gridTemplateRows: "repeat(auto-fill, 40px)",
				rowGap: "16px",
				columnGap: "32px",
				alignItems: "flex-start",
				justifyContent: "space-between",
				height: "400px",
				padding: "12px",
			}}
		>
			{isEmpty(equipmentList) && (
				<EmptyListTitle text={s.connect.observatory.empty_profile} />
			)}
			{equipmentList.map((equipment) => (
				<EquipmentBox
					key={equipment._id}
					equipment={equipment}
					setFormData={setEquipmentFormData}
				/>
			))}
			<IconButton
				onClick={() => setShowEquipmentTypeOverlay(true)}
				sx={{
					color: "white",
					position: "absolute",
					bottom: "20px",
					right: "36px",
				}}
			>
				<Icon name="add" size="24" />
			</IconButton>
			{/* {equipmentFormData && (
				<EquipmentForm
					{...equipmentFormData}
					getBack={() => {
						setEquipmentFormData(null);
					}}
					profileId={profileId}
				/>
			)} */}
			{showEquipmentTypeOverlay && (
				<EquipmentTypeOverlay
					close={() => setShowEquipmentTypeOverlay(false)}
					setEquipmentTypeId={setEquipmentTypeId}
				/>
			)}
			{showManufacturerOverlay && (
				<ManufacturerOverlay
					close={() => setShowManufacturerOverlay(false)}
					setManufacturerId={setManufacturerId}
					equipmentTypeId={equipmentTypeId}
					setShowModal={setShowManufacturerModal}
					manufacturers={manufacturers}
					setManufacturers={setManufacturers}
				/>
			)}

			{showEquipmentModelOverlay && (
				<EquipmentModelOverlay
					close={() => setShowEquipmentModelOverlay(false)}
					equipmentTypeId={equipmentTypeId}
					setEquipmentTypeId={setEquipmentTypeId}
					manufacturerId={manufacturerId}
					setManufacturerId={setManufacturerId}
					profileId={profileId}
					setEquipmentList={setEquipmentList}
					setShowModal={setShowModelModal}
					observatoryId={observatoryId}
					equipmentModels={equipmentModels}
					setEquipmentModels={setEquipmentModels}
				/>
			)}

			<ManufacturerModal
				open={showManufacturerModal}
				handleClose={() => setShowManufacturerModal(false)}
				equipmentType={equipmentTypeId}
				setManufacturers={setManufacturers}
			/>

			<ModelModal
				open={showModelModal}
				handleClose={() => setShowModelModal(false)}
				equipmentType={equipmentTypeId}
				manufacturer={manufacturerId}
				setEquipmentModels={setEquipmentModels}
			/>
		</Box>
	);
};

export default memo(EquipmentList);
