import React, { Suspense } from "react";
import KeepAlive from "react-activation";
import { useTheme } from "@mui/material";
import TabLoader from "@components/TabLoader";

const cachePage = (WrappedComponent, name) =>
{
	return (props) =>
	{
		const { palette } = useTheme();

		return (
			<KeepAlive name={name} cacheKey={name} id={name} autoFreeze={false}>
				<Suspense
					fallback={
						<div
							style={{
								width: "100vw",
								height: "100vh",
								backgroundColor: palette.black[600],
							}}
						>
							<TabLoader />
						</div>
					}
				>
					<WrappedComponent {...props} />
				</Suspense>
			</KeepAlive>
		);
	};
};

export default cachePage;
