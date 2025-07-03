const isTablet = (width) => width >= 768;

export const ObservatoryModernStyles = (windowWidth) =>
{
	const tablet = isTablet(windowWidth);

	return {
		collapseBodyContainer: {
			height: "100%",
			marginTop: "15px",
			marginHorizontal: "10px",
			display: "flex",
			flexDirection: "row",
			flex: 1,
		},
		collapseFormGroup: {
			paddingTop: "10px",
			paddingBottom: "10px",
		},
		groupContainer: {
			border: "1px solid #444",
			marginTop: "15px",
			borderRadius: "15px",
			padding: "10px",
			marginBottom: "20px",
			flex: 1,
		},
		collapseLabel: {
			width: "150px",
		},
		sectionTitle: {
			fontSize: "24px",
			fontWeight: "bold",
			marginBottom: "10px",
			color: "#FF6600", // Replace Palette.orange with hex color code
		},
		row: {
			display: "flex",
			flexDirection: tablet ? "row" : "column",
			alignItems: "center",
		},
		switchContainer: {
			marginBottom: "16px",
		},

		// Light Box Card
		lightBoxCard: {
			flex: 0,
			marginBottom: "16px",
		},
		lightControlContainer: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: tablet ? "0" : "20px",
		},
		lightControlTouchable: {
			width: "80px",
			height: "80px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		lightControlOuter: {
			width: "80px",
			height: "80px",
			borderRadius: "40px",
			borderWidth: "2px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		lightControlInner: {
			width: "30px",
			height: "30px",
			borderRadius: "15px",
		},
		lightStatusText: {
			marginTop: "8px",
			fontSize: "16px",
			fontWeight: "bold",
		},
		intensityText: {
			fontSize: "14px",
		},
		intensityControlContainer: {
			marginTop: tablet ? "0" : "20px",
			width: tablet ? "60%" : "100%",
		},
		intensityLabel: {
			marginBottom: "8px",
		},
		intensityControls: {
			display: "flex",
			flexDirection: "column",
			alignItems: "flex-start",
		},
		intensitySlider: {
			width: "100%",
			marginTop: "16px",
		},

		// Dust Cap Card
		capCard: {
			flex: 0,
		},
		capVisualContainer: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: tablet ? "0" : "20px",
		},
		capOuterRing: {
			width: "80px",
			height: "80px",
			borderRadius: "40px",
			borderWidth: "2px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		capClosed: {
			width: "60px",
			height: "60px",
			borderRadius: "30px",
		},
		capOpen: {
			width: "40px",
			height: "40px",
			borderRadius: "20px",
			borderWidth: "2px",
		},
		capStatusText: {
			width: "120px",
			marginTop: "8px",
			paddingLeft: "10px",
			paddingRight: "10px",
			fontSize: "16px",
			fontWeight: "bold",
		},
		capControlContainer: {
			marginTop: tablet ? "0" : "20px",
			width: tablet ? "60%" : "100%",
		},

		// Dome Card
		domeCard: {
			flex: 1,
			height: "100%",
		},
		domeControlsContainer: {
			flex: 2,
		},
		domeControlRow: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			marginBottom: "16px",
		},
		domeControlLabel: {
			width: "150px",
		},
		domeControlSwitch: {
			flex: 1,
		},
		abortButton: {
			marginLeft: "16px",
		},
		abortIcon: {
			width: "32px",
			height: "32px",
		},
		goButton: {
			width: "120px",
		},
		stopButton: {
			width: "120px",
		},

		// Dome Visualization
		domeVisualizationContainer: {
			width: "100%",
			alignItems: "center",
			justifyContent: "center",
		},
		domeVisualizationRow: {
			display: "flex",
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "center",
			width: "100%",
		},
		domeOuterCircle: {
			width: "200px",
			height: "200px",
			borderRadius: "100px",
			borderWidth: "3px",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			position: "relative",
			overflow: "hidden",
		},
		domeInnerCircle: {
			width: "180px",
			height: "180px",
			borderRadius: "90px",
			marginLeft: "25px",
			backgroundColor: "rgba(0, 0, 0, 0.3)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		domeShutter: {
			position: "absolute",
			width: "200px",
			height: "200px",
			display: "flex",
			alignItems: "center",
		},
		domeShutterSlit: {
			width: "40px",
			height: "100px",
			backgroundColor: "black",
			borderTopLeftRadius: "20px",
			borderTopRightRadius: "20px",
		},
		domeShutterClosed: {
			width: "180px",
			height: "180px",
			borderRadius: "90px",
			backgroundColor: "rgba(0, 0, 0, 0.7)",
		},
		domeAzimuthIndicator: {
			position: "absolute",
			width: "4px",
			height: "90px",
			backgroundColor: "#FF6600",
			bottom: "90px",
		},
		domeAzimuthText: {
			marginTop: "16px",
			fontSize: "18px",
			fontWeight: "bold",
			color: "rgba(255, 255, 255, 0.7)",
			alignSelf: "center",
		},
		domeStatusText: {
			marginTop: "8px",
			fontSize: "16px",
			color: "#ccc",
			alignSelf: "center",
		},

		// Roll-off Roof Visualization
		roofVisualizationContainer: {
			width: "100%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginTop: "16px",
		},
		roofContainer: {
			display: "flex",
			flexDirection: "row",
			width: "200px",
			height: "120px",
			borderWidth: "3px",
			borderRadius: "8px",
			borderColor: "#666",
			overflow: "hidden",
		},
		roofLeftSection: {
			width: "50%",
			height: "100%",
			backgroundColor: "#333333", // Dark gray for the building
		},
		roofRightSection: {
			width: "50%",
			height: "100%",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
		},
		roofClosed: {
			backgroundColor: "#FF6600", // Orange color for closed roof
		},
		roofOpen: {
			backgroundColor: "#222222", // Dark background for open roof
		},
		telescopeIcon: {
			width: "50px",
			height: "50px",
			transform: "rotate(45deg)",
		},
		roofStatusText: {
			marginTop: "16px",
			fontSize: "18px",
			fontWeight: "bold",
		},

		// Busy State Indicators
		busyIndicator: {
			position: "absolute",
			width: "100%",
			height: "100%",
			borderRadius: "100px",
			borderWidth: "3px",
			borderColor: "#FFCC00",
			opacity: 0.7,
		},
		busyText: {
			color: "#FFCC00",
			fontWeight: "bold",
		},
		busyBackground: {
			backgroundColor: "#FFCC00",
			borderRadius: "8px",
		},
		stopButtonContainer: {
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			marginBottom: "20px",
		},
		stopButton: {
			width: "75px",
			height: "75px",
			borderRadius: "100px",
			backgroundColor: "#CC0000",
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
		},
		stopButtonInner: {
			width: "80px",
			height: "16px",
			backgroundColor: "#ffffff",
			borderRadius: "8px",
		},
		stopButtonText: {
			color: "#ffffff",
			fontSize: "18px",
			fontWeight: "bold",
			marginTop: "8px",
			textAlign: "center",
		},
	};
};

export default ObservatoryModernStyles;
