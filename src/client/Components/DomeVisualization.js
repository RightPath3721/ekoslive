import React from "react";
import styled from "styled-components";

// Define color palette similar to the original
const Palette = {
	orange: "#FF6600",
};

/**
 * Creates an SVG path for an arc
 * @param {number} cx - Center X coordinate
 * @param {number} cy - Center Y coordinate
 * @param {number} radius - Radius of the arc
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @returns {string} SVG path string
 */
const createArcPath = (cx, cy, radius, startAngle, endAngle) =>
{
	const startAngleRad = (startAngle * Math.PI) / 180;
	const endAngleRad = (endAngle * Math.PI) / 180;

	const startX = cx + radius * Math.cos(startAngleRad);
	const startY = cy + radius * Math.sin(startAngleRad);
	const endX = cx + radius * Math.cos(endAngleRad);
	const endY = cy + radius * Math.sin(endAngleRad);

	const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

	return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
};

const DomeVisualization = ({
	dome,
	isDomeParked,
	isShutterOpen,
	domeAzimuth,
	domeAngularWidth,
	domeParkState,
	shutterMotionState,
	isDomeMoving,
	busyIndicatorStyle,
	className,
}) =>
{
	if (!dome || Object.keys(dome).length === 0) return null;

	const isDomeWithAzimuth = dome.canGoto && dome.canGoto();

	const svgSize = 180;
	const centerPoint = svgSize / 2;
	const radius = svgSize / 2 - 2;

	const shutterWidth = domeAngularWidth > 0 ? domeAngularWidth : 45;
	const adjustedAzimuth = domeAzimuth - 90;
	const startAngle = adjustedAzimuth - shutterWidth / 2;
	const endAngle = adjustedAzimuth + shutterWidth / 2;

	const shutterPath = createArcPath(
		centerPoint,
		centerPoint,
		radius,
		startAngle,
		endAngle,
	);

	const busyIndicatorStyleObj = {
		...busyIndicatorStyle,
		position: "absolute",
		width: "100%",
		height: "100%",
		borderRadius: "50%",
	};

	// Handling the Dome with Azimuth Case:
	if (isDomeWithAzimuth)
	{
		return (
			<DomeVisualizationContainer className={className}>
				<DomeOuterCircle borderColor={isDomeParked ? Palette.orange : "#666"}>
					<DomeInnerCircle>
						<svg
							width={svgSize}
							height={svgSize}
							viewBox={`0 0 ${svgSize} ${svgSize}`}
						>
							<circle
								cx={centerPoint}
								cy={centerPoint}
								r={radius}
								fill="rgba(255, 102, 0, 0.7)"
								stroke={Palette.orange}
								strokeWidth="2"
							/>
							{isShutterOpen && (
								<path
									d={shutterPath}
									fill="white"
									stroke="white"
									strokeWidth="1"
								/>
							)}
							<line
								x1={centerPoint}
								y1={centerPoint}
								x2={centerPoint}
								y2={0}
								stroke="grey"
								strokeWidth="4"
								transform={`rotate(${domeAzimuth} ${centerPoint} ${centerPoint})`}
							/>
						</svg>

						{(domeParkState === "IPS_BUSY" ||
							shutterMotionState === "IPS_BUSY" ||
							isDomeMoving) && <BusyIndicator style={busyIndicatorStyleObj} />}
					</DomeInnerCircle>
				</DomeOuterCircle>

				<DomeAzimuthText>
					{domeAzimuth.toFixed(0).toString().padStart(3, "0")}°
				</DomeAzimuthText>
				<DomeStatusText>
					{domeParkState === "IPS_BUSY"
						? isDomeParked
							? "Unparking..."
							: "Parking..."
						: isDomeParked
							? "Parked"
							: "Unparked"}
					{" | "}
					{shutterMotionState === "IPS_BUSY"
						? isShutterOpen
							? "Closing..."
							: "Opening..."
						: isShutterOpen
							? "Open"
							: "Closed"}
				</DomeStatusText>
			</DomeVisualizationContainer>
		);
	}

	// Handling the Roll-Off Roof Case:
	return (
		<RoofVisualizationContainer className={className}>
			<RoofContainer>
				<RoofLeftSection />
				<RoofRightSection
					className={isDomeParked ? "roof-closed" : "roof-open"}
				>
					{!isDomeParked && (
						<svg width={80} height={80} viewBox="0 0 100 100">
							<path
								d="M30 90 L50 50 L70 90"
								stroke="white"
								strokeWidth="3"
								fill="none"
							/>
							<path
								d="M35 80 L65 80"
								stroke="white"
								strokeWidth="2"
								fill="none"
							/>
							<path
								d="M25 50 L85 15"
								stroke="white"
								strokeWidth="6"
								strokeLinecap="round"
							/>
							<path
								d="M25 50 L15 55"
								stroke="white"
								strokeWidth="4"
								strokeLinecap="round"
							/>
							<path
								d="M85 15 L92 10"
								stroke="white"
								strokeWidth="6"
								strokeLinecap="round"
							/>
							<path
								d="M50 50 L55 40"
								stroke="white"
								strokeWidth="3"
								strokeLinecap="round"
							/>
						</svg>
					)}
				</RoofRightSection>

				{domeParkState === "IPS_BUSY" && (
					<BusyIndicator
						style={{
							...busyIndicatorStyleObj,
							borderRadius: "8px",
						}}
					/>
				)}
			</RoofContainer>

			<RoofStatusText>
				{domeParkState === "IPS_BUSY"
					? isDomeParked
						? "Opening..."
						: "Closing..."
					: isDomeParked
						? "Closed"
						: "Open"}
			</RoofStatusText>
		</RoofVisualizationContainer>
	);
};

// Styled components to replace the React Native styles
const DomeVisualizationContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10px;
`;

const DomeOuterCircle = styled.div`
	width: 180px;
	height: 180px;
	border-radius: 90px;
	border: 2px solid ${(props) => props.borderColor || "#666"};
	display: flex;
	align-items: center;
	justify-content: center;
`;

const DomeInnerCircle = styled.div`
	width: 170px;
	height: 170px;
	border-radius: 85px;
	padding: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
`;

const DomeAzimuthText = styled.p`
	margin-top: 12px;
	font-size: 20px;
	color: white;
	font-weight: bold;
`;

const DomeStatusText = styled.p`
	margin-top: 8px;
	font-size: 14px;
	color: #ccc;
`;

const RoofVisualizationContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10px;
`;

const RoofContainer = styled.div`
	width: 150px;
	height: 80px;
	display: flex;
	flex-direction: row;
	border: 2px solid #666;
	border-radius: 8px;
	overflow: hidden;
	position: relative;
`;

const RoofLeftSection = styled.div`
	flex: 1;
	background-color: #333;
`;

const RoofRightSection = styled.div`
	flex: 1;
	background-color: ${Palette.orange};
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.3s ease-in-out;

	&.roof-open {
		transform: translateX(0); /* Ensure it stays visible */
		/* If you want to animate it opening, keep this */
		/* transform: translateX(100%); */
	}

	&.roof-closed {
		transform: translateX(0); /* No transition when closed */
	}
`;

const RoofStatusText = styled.p`
	margin-top: 12px;
	font-size: 16px;
	color: white;
`;

const BusyIndicator = styled.div`
	animation: pulsate 1.5s infinite alternate;
	background-color: rgba(255, 255, 255, 0.2);

	@keyframes pulsate {
		0% {
			opacity: 0.2;
		}
		100% {
			opacity: 0.8;
		}
	}
`;

export default DomeVisualization;
