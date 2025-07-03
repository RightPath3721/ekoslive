import React, { useState, useEffect } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { 
    Box, 
    Typography, 
    Paper, 
    IconButton,
    Divider,
    useTheme,
    Button
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PushPinIcon from "@mui/icons-material/PushPin";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import { format } from "date-fns";

const AnnouncementItem = ({ announcement }) => {
    const { palette } = useTheme();
    
    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 2, 
                mb: 2, 
                position: "relative",
                border: announcement.isPinned ? `1px solid ${palette.primary.main}` : "none",
                backgroundColor: palette.common.black,
            }}
        >
            <Box sx={{ 
                display: "flex", 
                alignItems: "center",
                mb: 1
            }}>
                {announcement.isPinned && (
                    <PushPinIcon 
                        color="primary" 
                        sx={{ mr: 1 }}
                    />
                )}
                <Typography variant="h6" component="h3">
                    {announcement.title}
                </Typography>
            </Box>
            
            <Typography variant="caption" sx={{ display: "block", mb: 2, color: palette.white[900] }}>
                {format(new Date(announcement.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box 
                sx={{ 
                    color: palette.white[900],
                    "& img": { maxWidth: "100%" },
                    "& a": { color: palette.primary.main }
                }}
                dangerouslySetInnerHTML={{ __html: announcement.content }} 
            />
        </Paper>
    );
};

const ObservatoryAnnouncements = ({ onClose }) => {
    const { observatory } = useObservatoryPageContext();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const { palette } = useTheme();

    useEffect(() => {
        if (observatory?._id) {
            fetchAnnouncements();
        }
    }, [observatory?._id]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`/api/observatories/${observatory._id}/announcements`);
            setAnnouncements(data.announcements || []);
        } catch (error) {
            captureException(error);
            console.error("Error fetching announcements:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box sx={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                mb: 3
            }}>
                <Typography variant="h5" component="h2">
                    Announcements
                </Typography>
                
                <IconButton sx={{ color: palette.white[900] }} onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </Box>
            
            {loading ? (
                <Typography>Loading announcements...</Typography>
            ) : announcements.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        No Announcements
                    </Typography>
                    <Typography color="text.secondary">
                        There are no announcements for this observatory at this time.
                    </Typography>
                    <Button 
                        variant="outlined" 
                        onClick={onClose}
                        sx={{ mt: 2 }}
                    >
                        Back to Equipment
                    </Button>
                </Box>
            ) : (
                <Box>
                    {announcements.map(announcement => (
                        <AnnouncementItem 
                            key={announcement._id}
                            announcement={announcement}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ObservatoryAnnouncements;
