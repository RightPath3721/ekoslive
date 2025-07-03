import { Modal, Box } from '@mui/material';
import React, { useState } from 'react'
import { createPortal } from 'react-dom';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { styles } from '../shared/styles';
import GraphLegend from './GraphLegend';

const GraphModalBox = ({ open, close, children, legend }) => createPortal(
    <Modal open={open} onClose={close}>
        <Box sx={[styles.centerAbsolute, {
            padding: "12px",
            backgroundColor: "#1d1d1d",
            width: 600,
            height: 500,
        }]}>
            {children}
            {legend && <GraphLegend data={legend} />}

            <FullscreenExitIcon onClick={close} sx={{ color: "white", fontSize: 25, position: "absolute", top: "15px", right: "15px", cursor: "pointer" }} />
        </Box>
    </Modal>
    ,
    document.body
);

const GraphBox = ({ children, legend }) =>
{
    const [showFullGraph, setShowFullGraph] = useState(false);
    const toggle = () => setShowFullGraph(prev => !prev);

    return (
        <Box onClick={() => showFullGraph ? null : toggle()} sx={{ cursor: "pointer", position: "relative" }}>
            <GraphModalBox open={showFullGraph} close={toggle} legend={legend}>{children}</GraphModalBox>
            <FullscreenIcon sx={{ color: "white", fontSize: 15, position: "absolute", top: "6px", right: "6px" }} />
            {children}
        </Box>)
}

export default GraphBox