import React, { useCallback, useState } from "react";
import { useMediaQuery } from "react-responsive";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import PlusIcon from "@client/icons/PlusIcon";
import { styles } from "@client/shared/styles";
import s from "@common/shared/i18n/i18n";
import UploadForm from "@components/UploadPostForm";

const AddPostGridItem = ({ onUploadSubmit }) =>
{
	const isMediumScreen = useMediaQuery({ query: "(min-width: 480px)" });
	const [isUploadFormOpen, setIsUploadFormOpen] = useState(false);

	const toggleUploadForm = useCallback(
		() => setIsUploadFormOpen((p) => !p),
		[setIsUploadFormOpen],
	);

	return (
		<>
			<Grid
				item
				sx={{
					width: "100%",
					aspectRatio: 1,
					backgroundColor: "#424242",
					borderRadius: "8px",
				}}
			>
				<Button
					sx={[
						styles.center,
						{
							padding: 0,
							width: "100%",
							height: "100%",
							gap: ".25rem",
							fontWeight: 600,
							flexDirection: "column",
							fontSize: { xxs: ".75rem", xs: ".875rem" },
						},
					]}
					onClick={toggleUploadForm}
					variant="text"
				>
					<PlusIcon
						height={isMediumScreen ? 44 : 32}
						width={isMediumScreen ? 44 : 32}
					/>
					{s.social.new_post}
				</Button>
			</Grid>

			<UploadForm
				close={toggleUploadForm}
				open={isUploadFormOpen}
				submit={onUploadSubmit}
			/>
		</>
	);
};

export default AddPostGridItem;
