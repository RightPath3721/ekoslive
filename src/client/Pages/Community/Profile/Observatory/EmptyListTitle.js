import React from "react";
import Typography from "@mui/material/Typography";

const EmptyListTitle = ({ text }) =>
{
	return (
		<Typography sx={{ width: "100%", textAlign: "center" }}>{text}</Typography>
	);
};

export default EmptyListTitle;
