import React, { cloneElement } from "react";
import { Box, Button } from "@mui/material";
import Icon from "../../Components/Icon";
import { Palette } from "@common/shared/common/styles";
import AlignModuleIcon from "@client/icons/modules/AlignModuleIcon";
import FocusModuleIcon from "@client/icons/modules/FocusModuleIcon";
import GuideModuleIcon from "@client/icons/modules/GuideModuleIcon";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import { selectMetadata, selectConnectionOnline } from "@redux/selectors";
import { useSelector } from "react-redux";
import { get, isEmpty } from "lodash";

const ToolTips = ({
	showInfo,
	showOverlay,
	setActiveModule,
	setShowInfo,
	setShowOverlay,
	activeModule,
	showTargetGOTO,
	setShowTargetGOTO,
	setShowHistogram,
}) =>
{
	const online = useSelector(selectConnectionOnline);
	const metadata = useSelector(selectMetadata);

	const modules = [
		...(online
			? [
					{
						icon: <FocusModuleIcon />,
						title: "Focus",
						status: false,
						component: React.lazy(() => import("../FocusPage/Focus")),
					},
					{
						icon: <AlignModuleIcon />,
						title: "Align",
						component: React.lazy(() => import("../AlignPage/Align")),
						status: false,
					},
					{
						icon: <GuideModuleIcon />,
						title: "Guide",
						component: React.lazy(() => import("../GuidePage/Guide")),
						status: false,
					},
				]
			: []),
		{
			icon: <Icon name="books" />,
			title: "Logs",
			component: React.lazy(() => import("./Logs")),
			status: false,
		},
	];

	return (
		<Box sx={[LOCAL_STYLES.container]}>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "6px",
				}}
			>
				{modules.map((oneModule) =>
				{
					const isActiveModule = activeModule?.key === oneModule.title;
					return (
						<Button
							id={oneModule.title}
							sx={[
								LOCAL_STYLES.moduleButtonBox,
								{
									padding: 0,
									backgroundColor: isActiveModule ? "#FF660026" : "#FFFCFA1F",
								},
							]}
							onClick={() =>
							{
								const Component = oneModule.component;
								setActiveModule(<Component key={oneModule.title} />);
							}}
							key={oneModule.title}
						>
							{cloneElement(oneModule.icon, {
								width: 20,
								height: 20,
								color: isActiveModule ? "#FF6600" : "#FFFCFA",
							})}
						</Button>
					);
				})}
				<Button
					onClick={setShowInfo}
					sx={[
						LOCAL_STYLES.moduleButtonBox,
						{
							backgroundColor: showInfo ? "#FF660026" : "#FFFCFA1F",
						},
					]}
				>
					<Icon
						name="info"
						size={20}
						color={showInfo ? "#FF6600" : "#FFFCFA"}
					/>
				</Button>
			</Box>
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					gap: "6px",
				}}
			>
				<Button
					onClick={setShowOverlay}
					sx={[
						LOCAL_STYLES.showInfoBox,
						{
							backgroundColor: showOverlay ? Palette.orange : Palette.grey33,
							"&:hover": { backgroundColor: showOverlay ? Palette.orange : "" },
						},
					]}
				>
					<Icon name="fits" size={20} color={Palette.white} />
				</Button>
				<Button
					disabled={!get(metadata, "hasWCS", false)}
					onClick={setShowTargetGOTO}
					sx={[
						LOCAL_STYLES.showInfoBox,
						{
							backgroundColor: showTargetGOTO ? Palette.orange : Palette.grey33,
							"&:hover": {
								backgroundColor: showTargetGOTO ? Palette.orange : "",
							},
						},
					]}
				>
					<AdsClickIcon sx={{ color: Palette.white, fontSize: 20 }} />
				</Button>
				<Button
					disabled={isEmpty(metadata)}
					onClick={setShowHistogram}
					sx={[LOCAL_STYLES.showInfoBox, { backgroundColor: Palette.grey33 }]}
				>
					<Icon name="barchart" color={Palette.white} />
				</Button>
			</Box>
		</Box>
	);
};

const LOCAL_STYLES = {
	container: {
		position: "absolute",
		top: "100px",
		left: "24px",
		zIndex: 1,
		height: "calc(100vh - 320px)",
		maxHeight: "500px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		alignItems: "start",
	},
	moduleButtonBox: {
		padding: "4px",
		borderRadius: "4px",
		width: "30px",
		height: "30px",
		display: "inline-grid",
		placeItems: "center",
		minWidth: "auto",
	},
	showInfoBox: {
		width: "30px",
		padding: "4px 6px",
		minWidth: "auto",
	},
};

export default ToolTips;
