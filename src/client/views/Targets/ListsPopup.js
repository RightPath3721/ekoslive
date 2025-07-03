import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import s from "@common/shared/i18n/i18n";
import { Palette } from "@common/shared/common/styles";
import ListModalRow from "./ListModalRow";
import EkosModal from "../../Components/EkosModal";

const ListsPopup = ({
	target,
	setListsPopup,
	lists,
	objectName,
	addToList,
}) =>
{
	return (
		<EkosModal
			initialValue={{ x: "80vh", y: "40vh" }}
			onClose={() => setListsPopup({ show: false, target: {} })}
			sx={{
				borderColor: `1px solid ${Palette.grey33}`,
				borderRadius: "5px",
				padding: "38px 18px 18px",
			}}
		>
			<Typography style={{ color: "white", fontSize: "18px" }}>
				Add {objectName} to:
			</Typography>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "10px",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				{lists.map((list) =>
				{
					if (!list.deletedAt)
					{
						return (
							<ListModalRow
								key={list}
								target={target}
								list={list}
								listName={list.name}
								objectName={objectName}
								addToList={addToList}
							/>
						);
					}
				})}
			</Box>
			<Button onClick={() => setListsPopup({ show: false, target: {} })}>
				<Typography style={{ color: Palette.white70 }}>
					{s.general.ok}
				</Typography>
			</Button>
		</EkosModal>
	);
};

export default ListsPopup;
