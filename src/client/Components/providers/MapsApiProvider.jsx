import React, { useState } from "react";
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { Box, CircularProgress, Typography } from "@mui/material";

// ApiLoadedGuard component to handle loading state
const ApiLoadedGuard = ({ children }) => {
	const isLoaded = useApiIsLoaded();
	
	if (!isLoaded) {
		return (
			<Box sx={{ 
				display: 'flex', 
				flexDirection: 'column',
				alignItems: 'center', 
				justifyContent: 'center',
				height: '100%',
				gap: 2
			}}>
				<CircularProgress />
				<Typography variant="body2" color="text.secondary">
					Loading Maps...
				</Typography>
			</Box>
		);
	}
	return children;
};

const MapsApiProvider = ({ children }) => {
	const [hasError, setHasError] = useState(false);
	if (hasError) {
		return (
			<Box sx={{ 
				display: 'flex', 
				flexDirection: 'column',
				alignItems: 'center', 
				justifyContent: 'center',
				height: '100%',
				color: 'error.main'
			}}>
				<Typography>Failed to load Google Maps.</Typography>
				<Typography variant="body2" color="text.secondary">
					Please check your internet connection and try again.
				</Typography>
			</Box>
		);
	}

	return (
		<APIProvider
			apiKey={process.env.REACT_APP_GOOGLE_MAPS_KEY}
			libraries={["geometry"]}
			onError={() => setHasError(true)}
		>
			<ApiLoadedGuard>
				{children}
			</ApiLoadedGuard>
		</APIProvider>
	);
};

export default MapsApiProvider;
