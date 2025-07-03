import React from 'react';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Typography, 
    Button,
    Paper,
    Box,
    IconButton,
    useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Component to display observatory usage guidelines in a modal dialog
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to call when dialog is closed
 * @param {string} props.guidelines - The guidelines text to display
 */
const ObservatoryGuidelines = ({ open, onClose, guidelines }) => {
    const { palette } = useTheme();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${palette.divider}`
            }}>
                <Typography variant="h6">Observatory Usage Guidelines</Typography>
                <IconButton onClick={onClose} size="small" sx={{ color: palette.white[900] }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ py: 2 }}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 2, 
                            maxHeight: '60vh', 
                            overflow: 'auto',
                            bgcolor: 'transparent'
                        }}
                    >
                        {guidelines ? (
                            <Box 
                                sx={{ 
                                    color: palette.white[900],
                                    "& img": { maxWidth: "100%" },
                                    "& a": { color: palette.primary.main }
                                }}
                                dangerouslySetInnerHTML={{ __html: guidelines }} 
                            />
                        ) : (
                            <Typography 
                                variant="body1" 
                                sx={{ color: palette.white[900] }}
                            >
                                No guidelines provided for this observatory.
                            </Typography>
                        )}
                    </Paper>
                </Box>
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${palette.divider}` }}>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ObservatoryGuidelines;
