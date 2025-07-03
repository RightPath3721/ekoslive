import React from "react";
import isEqual from "lodash/isEqual";
import { useSelector } from "react-redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { styles } from "@client/shared/styles";
import CloseButton from "@components/CloseButton";
import s from "@common/shared/i18n/i18n";
import { getTotalMessiers } from "@redux/selectors";
import { useTheme } from "@mui/material";

const messiers = [
	{
		number: "M 1",
		name: "Crab Nebula",
	},
	{
		number: "M 2",
		name: "NGC 7089",
	},
	{
		number: "M 3",
		name: "NGC 5272",
	},
	{
		number: "M 4",
		name: "NGC 6121",
	},
	{
		number: "M 5",
		name: "NGC 5904",
	},
	{
		number: "M 6",
		name: "Butterfly Cluster",
	},
	{
		number: "M 7",
		name: "Ptolemy Cluster",
	},
	{
		number: "M 8",
		name: "Lagoon Nebula",
	},
	{
		number: "M 9",
		name: "NGC 6333",
	},
	{
		number: "M 10",
		name: "NGC 6254",
	},
	{
		number: "M 11",
		name: "Wild Duck Cluster",
	},
	{
		number: "M 12",
		name: "NGC 6218",
	},
	{
		number: "M 13",
		name: "Great Globular Cluster in Hercules",
	},
	{
		number: "M 14",
		name: "NGC 6402",
	},
	{
		number: "M 15",
		name: "NGC 7078",
	},
	{
		number: "M 16",
		name: "Eagle Nebula",
	},
	{
		number: "M 17",
		name: "Omega Nebula",
	},
	{
		number: "M 18",
		name: "NGC 6613",
	},
	{
		number: "M 19",
		name: "NGC 6273",
	},
	{
		number: "M 20",
		name: "Trifid Nebula",
	},
	{
		number: "M 21",
		name: "NGC 6531",
	},
	{
		number: "M 22",
		name: "Sagittarius Cluster",
	},
	{
		number: "M 23",
		name: "NGC 6494",
	},
	{
		number: "M 24",
		name: "Sagittarius Star Cloud",
	},
	{
		number: "M 25",
		name: "IC 4725",
	},
	{
		number: "M 26",
		name: "NGC 6694",
	},
	{
		number: "M 27",
		name: "Dumbbell Nebula",
	},
	{
		number: "M 28",
		name: "NGC 6626",
	},
	{
		number: "M 29",
		name: "NGC 6913",
	},
	{
		number: "M 30",
		name: "NGC 7099",
	},
	{
		number: "M 31",
		name: "Andromeda Galaxy",
	},
	{
		number: "M 32",
		name: "NGC 221",
	},
	{
		number: "M 33",
		name: "Triangulum Galaxy",
	},
	{
		number: "M 34",
		name: "NGC 1039",
	},
	{
		number: "M 35",
		name: "NGC 2168",
	},
	{
		number: "M 36",
		name: "NGC 1960",
	},
	{
		number: "M 37",
		name: "NGC 2099",
	},
	{
		number: "M 38",
		name: "NGC 1912",
	},
	{
		number: "M 39",
		name: "NGC 7092",
	},
	{
		number: "M 40",
		name: "Winnecke 4",
	},
	{
		number: "M 41",
		name: "NGC 2287",
	},
	{
		number: "M 42",
		name: "Orion Nebula",
	},
	{
		number: "M 43",
		name: "De Mairan's Nebula",
	},
	{
		number: "M 44",
		name: "Beehive Cluster",
	},
	{
		number: "M 45",
		name: "Pleiades",
	},
	{
		number: "M 46",
		name: "NGC 2437",
	},
	{
		number: "M 47",
		name: "NGC 2422",
	},
	{
		number: "M 48",
		name: "NGC 2548",
	},
	{
		number: "M 49",
		name: "NGC 4472",
	},
	{
		number: "M 50",
		name: "NGC 2323",
	},
	{
		number: "M 51",
		name: "Whirlpool Galaxy",
	},
	{
		number: "M 52",
		name: "NGC 7654",
	},
	{
		number: "M 53",
		name: "NGC 5024",
	},
	{
		number: "M 54",
		name: "NGC 6715",
	},
	{
		number: "M 55",
		name: "NGC 6809",
	},
	{
		number: "M 56",
		name: "NGC 6779",
	},
	{
		number: "M 57",
		name: "Ring Nebula",
	},
	{
		number: "M 58",
		name: "NGC 4579",
	},
	{
		number: "M 59",
		name: "NGC 4621",
	},
	{
		number: "M 60",
		name: "NGC 4649",
	},
	{
		number: "M 61",
		name: "NGC 4303",
	},
	{
		number: "M 62",
		name: "NGC 6266",
	},
	{
		number: "M 63",
		name: "Sunflower Galaxy",
	},
	{
		number: "M 64",
		name: "Black Eye Galaxy",
	},
	{
		number: "M 65",
		name: "NGC 3623",
	},
	{
		number: "M 66",
		name: "NGC 3627",
	},
	{
		number: "M 67",
		name: "NGC 2682",
	},
	{
		number: "M 68",
		name: "NGC 4590",
	},
	{
		number: "M 69",
		name: "NGC 6637",
	},
	{
		number: "M 70",
		name: "NGC 6681",
	},
	{
		number: "M 71",
		name: "NGC 6838",
	},
	{
		number: "M 72",
		name: "NGC 6981",
	},
	{
		number: "M 73",
		name: "NGC 6994",
	},
	{
		number: "M 74",
		name: "NGC 628",
	},
	{
		number: "M 75",
		name: "NGC 6864",
	},
	{
		number: "M 76",
		name: "Little Dumbbell Nebula",
	},
	{
		number: "M 77",
		name: "NGC 1068",
	},
	{
		number: "M 78",
		name: "NGC 2068",
	},
	{
		number: "M 79",
		name: "NGC 1904",
	},
	{
		number: "M 80",
		name: "NGC 6093",
	},
	{
		number: "M 81",
		name: "Bode's Galaxy",
	},
	{
		number: "M 82",
		name: "Cigar Galaxy",
	},
	{
		number: "M 83",
		name: "Southern Pinwheel Galaxy",
	},
	{
		number: "M 84",
		name: "NGC 4374",
	},
	{
		number: "M 85",
		name: "NGC 4382",
	},
	{
		number: "M 86",
		name: "NGC 4406",
	},
	{
		number: "M 87",
		name: "Virgo A",
	},
	{
		number: "M 88",
		name: "NGC 4501",
	},
	{
		number: "M 89",
		name: "NGC 4552",
	},
	{
		number: "M 90",
		name: "NGC 4569",
	},
	{
		number: "M 91",
		name: "NGC 4548",
	},
	{
		number: "M 92",
		name: "NGC 6341",
	},
	{
		number: "M 93",
		name: "NGC 2447",
	},
	{
		number: "M 94",
		name: "NGC 4736",
	},
	{
		number: "M 95",
		name: "NGC 3351",
	},
	{
		number: "M 96",
		name: "NGC 3368",
	},
	{
		number: "M 97",
		name: "Owl Nebula",
	},
	{
		number: "M 98",
		name: "NGC 4192",
	},
	{
		number: "M 99",
		name: "NGC 4254",
	},
	{
		number: "M 100",
		name: "NGC 4321",
	},
	{
		number: "M 101",
		name: "Pinwheel Galaxy",
	},
	{
		number: "M 102",
		name: "NGC 5866",
	},
	{
		number: "M 103",
		name: "NGC 581",
	},
	{
		number: "M 104",
		name: "Sombrero Galaxy",
	},
	{
		number: "M 105",
		name: "NGC 3379",
	},
	{
		number: "M 106",
		name: "NGC 4258",
	},
	{
		number: "M 107",
		name: "NGC 6171",
	},
	{
		number: "M 108",
		name: "NGC 3556",
	},
	{
		number: "M 109",
		name: "NGC 3992",
	},
	{
		number: "M 110",
		name: "NGC 205",
	},
];

const Messier = ({ isOpen, close }) =>
{
	const totalMessiers = useSelector(getTotalMessiers, isEqual);
	const { palette } = useTheme();

	const tableStyles = {
		Header: {
			position: "relative",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			color: palette.primary.main,
			fontWeight: "bold",
		},
		title: {
			fontSize: "20px",
		},
		Score: {
			position: "absolute",
			left: "20px",
		},
		tableContainer: {
			flex: 1,
			overflowY: "auto",
			marginTop: "20px",
		},
		tableHeader: {
			position: "sticky",
			top: 0,
			backgroundColor: palette.black[900],
		},
		table: {
			width: "100%",
			borderCollapse: "collapse",
		},
		th: {
			padding: "12px",
			backgroundColor: palette.black[500],
			color: palette.white[900],
			border: `1px solid ${palette.black[500]}`,
		},
		td: {
			padding: "12px",
			backgroundColor: palette.black[900],
			color: palette.white[900],
			border: `1px solid ${palette.black[500]}`,
			textAlign: "center",
			verticalAlign: "middle",
		},
	};
	return (
		<Modal open={isOpen} onClose={close}>
			<Box
				sx={[
					styles.centerAbsolute,
					{
						width: "600px",
						height: "600px",
						display: "flex",
						flexDirection: "column",
						borderRadius: "16px",
						backgroundColor: palette.black[900],
						border: `1px solid ${palette.black[500]}`,
						padding: "16px",
						position: "relative",
					},
				]}
			>
				<CloseButton right="10px" top="10px" onChange={close} />
				<div style={tableStyles.Header}>
					<h1 style={tableStyles.title}>
						{s.achievements.all_messier_title} {s.general.details}
					</h1>
				</div>
				<div style={tableStyles.tableContainer}>
					<table style={tableStyles.table}>
						<thead style={tableStyles.tableHeader}>
							<tr>
								<th style={tableStyles.th}></th>
								<th style={tableStyles.th}>{s.cloud.filters_drawer.object}</th>
								<th style={tableStyles.th}>{s.general.name}</th>
								<th style={tableStyles.th}>{s.general.status}</th>
							</tr>
						</thead>
						<tbody>
							{messiers
								.sort((a, b) =>
								{
									const aChecked = totalMessiers.includes(a.number);
									const bChecked = totalMessiers.includes(b.number);

									if (aChecked && !bChecked) return -1;
									if (!aChecked && bChecked) return 1;
									return 0;
								})
								.map((messier) =>
								{
									const check = totalMessiers.includes(messier.number);
									const key = messier.number.replace(" ", "").toLowerCase();

									return (
										<tr key={messier.number}>
											<td style={tableStyles.td}>
												<img
													src={require(`@images/messiers/${key}.webp`)}
													alt={messier.name}
													width="45px"
													height="45px"
													style={{ borderRadius: "8px" }}
													onError={(e) =>
														(e.target.src = require("@images/badges/cosmic_marathon.webp"))
													}
													loading="lazy"
												/>
											</td>
											<td style={tableStyles.td}>{messier.number}</td>
											<td style={tableStyles.td}>{messier.name}</td>
											<td style={tableStyles.td}>
												{check ? (
													<CheckCircleOutlineIcon
														sx={{ color: palette.success.main, fontSize: 24 }}
													/>
												) : (
													<HighlightOffIcon
														sx={{ color: palette.white[900], fontSize: 24 }}
													/>
												)}
											</td>
										</tr>
									);
								})}
						</tbody>
					</table>
				</div>
			</Box>
		</Modal>
	);
};

export default Messier;
