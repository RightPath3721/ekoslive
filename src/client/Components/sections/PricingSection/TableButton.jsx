import React from "react";
import { cn } from "@utils/cn";

const TableButton = ({ className, onClick = () => {} }) =>
{
	return <button onClick={onClick} className={cn("primary-btn", className)}>Choose Plan</button>;
};

export default TableButton;
