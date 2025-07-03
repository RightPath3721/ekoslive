import React, { Suspense, useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import ObservatoryPreviewBox from "./PreviewBox";
import { styles } from "@client/shared/styles";
import Icon from "@components/Icon";
import { useActiveObservatory } from "./ObservatoryContext";
import useObservatories from "@hooks/useObservatories";
import TabLoader from "@components/TabLoader";
import s from "@common/shared/i18n/i18n";
const ObservatoryMenu = React.lazy(() => import("./ObservatoryMenu"));

const ObservatoriesPreview = () =>
{
	const { observatories, setObservatories } = useObservatories();
	const [isObservatoryMenuOpen, setIsObservatoryMenuOpen] = useState(false);
	const { setObservatoryId } = useActiveObservatory();

	const onClose = useCallback(() =>
	{
		setIsObservatoryMenuOpen(false);
		setObservatoryId(null);
	}, [setIsObservatoryMenuOpen, setObservatoryId]);

	return (
		<>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					alignItems: "flex-end",
					justifyContent: "center",
					gap: "12px",
					paddingRight: "12px",
				}}
			>
				<Typography sx={{ color: "white", width: "100%" }} align="center">
					{s.connect.observatories}
				</Typography>
				<Box
					sx={[
						styles.horizontalScrollBar,
						{
							display: "flex",
							flexDirection: "row",
							gap: "4px",
							flexWrap: "nowrap",
							overflowX: "scroll",
							maxWidth: "340px",
						},
					]}
				>
					{observatories.map((observatory) => (
						<ObservatoryPreviewBox
							key={observatory._id}
							observatory={observatory}
							openMenu={() => setIsObservatoryMenuOpen(true)}
						/>
					))}
					<IconButton
						onClick={() => setIsObservatoryMenuOpen(true)}
						sx={{ color: "white" }}
					>
						<Icon name="add" size="32px" />
					</IconButton>
				</Box>
			</Box>
			<Suspense fallback={<TabLoader />}>
				{isObservatoryMenuOpen && (
					<ObservatoryMenu
						setObservatories={setObservatories}
						open={isObservatoryMenuOpen}
						close={onClose}
					/>
				)}
			</Suspense>
		</>
	);
};

export default ObservatoriesPreview;
