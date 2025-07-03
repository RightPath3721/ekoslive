import React, { Suspense, useCallback, useState } from "react";
import IconButton from "@mui/material/IconButton";
import FilterSettingsIcon from "@client/icons/FilterSettingsIcon";
import TabLoader from "@components/TabLoader";

const AdvancedSettings = React.lazy(() => import("./AdvancedSettings"));

const AdvancedSettingsToggler = (props) =>
{
	const [isOpen, setIsOpen] = useState(false);

	const toggleAdvancedSettings = useCallback(
		() => setIsOpen((p) => !p),
		[setIsOpen],
	);

	return (
		<>
			<IconButton
				onClick={toggleAdvancedSettings}
				sx={{ color: "common.white", ":hover": { color: "primary.main" } }}
			>
				<FilterSettingsIcon color="currentColor" />
			</IconButton>
			{isOpen && (
				<Suspense fallback={<TabLoader />}>
					<AdvancedSettings {...props} close={toggleAdvancedSettings} />
				</Suspense>
			)}
		</>
	);
};

export default AdvancedSettingsToggler;
