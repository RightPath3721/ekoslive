import React, { useState } from "react";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";

const examples = [
    {
        targets: "Find all galaxies above 30 degrees at the North",
        view: "Filter images with Red filter",
    },
    {
        targets: "Find all nebulae that are between 1 and 3 degrees",
        view: "Show me images that I took May 25",
    },
    {
        targets:
            "Find all comets above 40 degrees and I can observe with my camera",
        view: "Show me M 31 images",
    },
];

const StellaFilterInputTooltip = ({ mode }) =>
{
    const [open, setOpen] = useState(false);

    const handleTooltipClose = () =>
    {
        setOpen(false);
    };

    const handleTooltipOpen = () =>
    {
        setOpen(true);
    };

    return (
        <ClickAwayListener onClickAway={handleTooltipClose}>
            <div>
                <Tooltip
                    PopperProps={{
                        disablePortal: true,
                        sx: { ".MuiTooltip-tooltip": { maxWidth: "340px" } },
                    }}
                    onClose={handleTooltipClose}
                    open={open}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                    title={
                        <Grid container>
                            <Grid item>
                                <Typography sx={{ color: "white", fontSize: "14px" }}>
                                    {mode === "targets"
                                        ? "Filter targets with Stella AI. Here are some examples:"
                                        : "Filter images with Stella AI. Here are some examples:"}
                                </Typography>
                            </Grid>
                            {examples.map((example, idx) => (
                                <Grid item key={idx}>
                                    <Typography sx={{ color: "white", fontSize: "12px" }}>
                                        {idx + 1}.&nbsp;{example[mode]}
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    }
                >
                    <IconButton onClick={handleTooltipOpen}>
                        <QuestionMarkIcon style={{ fontSize: 20, color: "#CECECE" }} />
                    </IconButton>
                </Tooltip>
            </div>
        </ClickAwayListener>
    );
};

export default StellaFilterInputTooltip;
