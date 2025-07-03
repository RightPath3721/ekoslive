import React, { useState } from "react";
import { Link } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import LanguageIcon from "@mui/icons-material/Language";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { useTheme } from "@mui/material/styles";
import { useMediaQuery } from "react-responsive";

const truncate = (str) =>
{
	if (!str) return "";
	if (str.length <= 15) return str;
	return `${str?.slice(0, 6)} ... ${str?.slice(-5)}`;
};

export default function IconBreadcrumbs()
{
	const { breadcrumb } = useBreadcrumbContext();
	const isXsScreen = useMediaQuery({ query: "(min-width: 480px)" });
	const isMediumScreen = useMediaQuery({ query: "(min-width: 640px)" });
	const isLargeScreen = useMediaQuery({ query: "(min-width: 1024px)" });
	const [anchorEl, setAnchorEl] = useState(null);
	const open = Boolean(anchorEl);

	const theme = useTheme();

	const handleClick = (event) =>
	{
		if (event)
		{
			setAnchorEl(event.currentTarget);
		}
	};

	const handleClose = () =>
	{
		setAnchorEl(null);
	};

	if (!isLargeScreen)
	{
		const currentPage = breadcrumb?.[breadcrumb?.length - 1];
		const initialLocation = breadcrumb?.[0];
		const breadcrumbs = breadcrumb?.slice(
			isXsScreen && !isMediumScreen ? 1 : 0,
			-1,
		);

		return (
			<>
				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					aria-labelledby="navigation-breadcrumbs"
				>
					{breadcrumbs?.map((item, index) => (
						<MenuItem
							key={index}
							onClick={handleClose}
							component={Link}
							to={item.link}
							variant="body2"
						>
							{truncate(item.name)}
						</MenuItem>
					))}
				</Menu>
				<Breadcrumbs
					aria-label="navigation-breadcrumbs"
					sx={{
						color: theme.palette.white[900],
						"& .MuiBreadcrumbs-separator": {
							marginLeft: ".25rem",
							marginRight: ".25rem",
						},
					}}
				>
					{isXsScreen && !isMediumScreen && (
						<MuiLink
							underline="hover"
							sx={{ display: "flex", alignItems: "center" }}
							color="inherit"
							component={Link}
							to={initialLocation?.link}
							variant="body2"
						>
							{initialLocation?.name === "Community" && (
								<LanguageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
							)}
							{truncate(initialLocation?.name)}
						</MuiLink>
					)}
					<IconButton
						sx={{ padding: "0 !important" }}
						color="inherit"
						onClick={handleClick}
					>
						<MoreHorizIcon />
					</IconButton>
					<Typography
						variant="body2"
						component="h3"
						sx={{ color: "white", display: "flex", alignItems: "center", cursor: "default" }}
					>
						{truncate(currentPage?.name)}
					</Typography>
				</Breadcrumbs>
			</>
		);
	}
	if (breadcrumb?.length <= 3)
	{
		return (
			<Breadcrumbs
				aria-label="navigation-breadcrumbs"
				sx={{ color: theme.palette.white[900] }}
			>
				{breadcrumb.map((item, index) =>
					index < breadcrumb.length - 1 ? (
						<MuiLink
							key={index}
							underline="hover"
							sx={{ display: "flex", alignItems: "center", color: "white" }}
							color="inherit"
							to={item.link}
							component={Link}
							variant="body2"
						>
							{item.name === "Community" && (
								<LanguageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
							)}
							{truncate(item.name)}
						</MuiLink>
					) : (
						<Typography
							key={index}
							variant="body2"
							component="h3"
							sx={{ color: "white", display: "flex", alignItems: "center", cursor: "default" }}
						>
							{truncate(item.name)}
						</Typography>
					),
				)}
			</Breadcrumbs>
		);
	}
	else if (breadcrumb?.length > 3)
	{
		const initialBreadcrumb = breadcrumb?.[0];
		const penultimateBreadcrumb = breadcrumb?.[breadcrumb.length - 2];
		const finalBreadcrumb = breadcrumb?.[breadcrumb.length - 1];
		const middleBreadcrumbs = breadcrumb?.slice(1, -2);

		return (
			<>
				<Menu
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					aria-labelledby="navigation-breadcrumbs"
				>
					{middleBreadcrumbs?.map((item, index) => (
						<MenuItem
							key={index}
							onClick={handleClose}
							component={Link}
							to={item.link}
							variant="body2"
						>
							{truncate(item.name)}
						</MenuItem>
					))}
				</Menu>
				<Breadcrumbs
					aria-label="navigation-breadcrumbs"
					sx={{ color: theme.palette.white[900] }}
				>
					<MuiLink
						underline="hover"
						sx={{ display: "flex", alignItems: "center" }}
						color="inherit"
						component={Link}
						to={initialBreadcrumb?.link}
						variant="body2"
					>
						{initialBreadcrumb?.name === "Community" && (
							<LanguageIcon sx={{ mr: 0.5 }} fontSize="inherit" />
						)}
						{truncate(initialBreadcrumb?.name)}
					</MuiLink>
					<IconButton
						color="inherit"
						sx={{ padding: "0px !important" }}
						onClick={handleClick}
					>
						<MoreHorizIcon />
					</IconButton>
					<MuiLink
						underline="hover"
						sx={{ display: "flex", alignItems: "center", color: "white" }}
						color="inherit"
						to={penultimateBreadcrumb?.link}
						component={Link}
						variant="body2"
					>
						{truncate(penultimateBreadcrumb?.name)}
					</MuiLink>
					<Typography
						variant="body2"
						component="h3"
						sx={{ color: "white", display: "flex", alignItems: "center", cursor: "default" }}
					>
						{truncate(finalBreadcrumb?.name)}
					</Typography>
				</Breadcrumbs>
			</>
		);
	}
}
