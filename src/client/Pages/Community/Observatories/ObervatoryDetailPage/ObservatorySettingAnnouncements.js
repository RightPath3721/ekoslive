import React, { useState, useEffect } from "react";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { 
    Box, 
    Typography, 
    Button, 
    TextField, 
    List, 
    ListItem, 
    IconButton, 
    Divider, 
    Paper, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox,
    useTheme
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import AddIcon from "@mui/icons-material/Add";
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import useActiveUser from "@hooks/useActiveUser";
import RichEditor from "@components/RichEditor";
import { format } from "date-fns";

const AnnouncementForm = ({ 
    announcement = null, 
    onSubmit, 
    onCancel 
}) => {
    const [title, setTitle] = useState(announcement?.title || "");
    const [content, setContent] = useState(announcement?.content || "");
    const [isPinned, setIsPinned] = useState(announcement?.isPinned || false);
    const { palette } = useTheme();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            return;
        }
        
        onSubmit({
            title,
            content,
            isPinned
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
                fullWidth
                label="Announcement Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                margin="normal"
                InputLabelProps={{
                    sx: { color: "currentcolor" },
                }}
                InputProps={{
                    sx: {
                        color: "currentcolor",
                    },
                }}
            />
            
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                Announcement Content
            </Typography>
            
            <Box sx={{ 
                mb: 2, 
                "& .jodit-container": { 
                    border: `1px solid ${palette.grey.main}`,
                    minHeight: "200px"
                } 
            }}>
                <RichEditor 
                    value={content} 
                    onChange={(newContent) => setContent(newContent)} 
                />
            </Box>
            
            <FormControlLabel
                control={
                    <Checkbox 
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        icon={<PushPinOutlinedIcon />}
                        checkedIcon={<PushPinIcon />}
                    />
                }
                label="Pin this announcement"
            />
            
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button 
                    variant="outlined" 
                    onClick={onCancel}
                    sx={{ mr: 1 }}
                >
                    Cancel
                </Button>
                <Button 
                    variant="contained" 
                    type="submit"
                    disabled={!title.trim() || !content.trim()}
                >
                    {announcement ? "Update" : "Create"} Announcement
                </Button>
            </Box>
        </Box>
    );
};

const AnnouncementItem = ({ 
    announcement, 
    onEdit, 
    onDelete, 
    onTogglePin 
}) => {
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
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1
            }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
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
                
                <Box>
                    <IconButton 
                        onClick={() => onTogglePin(announcement._id)}
                        title={announcement.isPinned ? "Unpin" : "Pin"}
                        sx={{ color: palette.white[900] }}
                    >
                        {announcement.isPinned ? 
                            <PushPinIcon /> : 
                            <PushPinOutlinedIcon />
                        }
                    </IconButton>
                    <IconButton 
                        onClick={() => onEdit(announcement)}
                        title="Edit"
                        sx={{ color: palette.white[900] }}
                    >
                        <EditIcon />
                    </IconButton>
                    <IconButton 
                        onClick={() => onDelete(announcement._id)}
                        title="Delete"
                        sx={{ color: palette.white[900] }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Box>
            </Box>
            
            <Typography variant="caption" sx={{ display: "block", mb: 2, color: palette.white[900] }}>
                {format(new Date(announcement.createdAt), "MMMM d, yyyy 'at' h:mm a")}
            </Typography>
            
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

const ObservatorySettingAnnouncements = () => {
    const user = useActiveUser();
    const { observatory, setObservatory } = useObservatoryPageContext();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [currentAnnouncement, setCurrentAnnouncement] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);
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

    const handleCreateAnnouncement = async (announcementData) => {
        try {
            const { data } = await axios.post(
                `/api/observatories/${observatory._id}/announcements`,
                announcementData,
                {
                    params: {
                        username: user?.username,
                        token: user?.token,
                    },
                }
            );
            
            // Update the announcements list
            await fetchAnnouncements();
            setShowForm(false);
        } catch (error) {
            captureException(error);
            console.error("Error creating announcement:", error);
        }
    };

    const handleUpdateAnnouncement = async (announcementData) => {
        try {
            const { data } = await axios.put(
                `/api/observatories/${observatory._id}/announcements/${currentAnnouncement._id}`,
                announcementData,
                {
                    params: {
                        username: user?.username,
                        token: user?.token,
                    },
                }
            );
            
            // Update the announcements list
            await fetchAnnouncements();
            setShowForm(false);
            setCurrentAnnouncement(null);
        } catch (error) {
            captureException(error);
            console.error("Error updating announcement:", error);
        }
    };

    const handleDeleteAnnouncement = async () => {
        try {
            await axios.delete(
                `/api/observatories/${observatory._id}/announcements/${announcementToDelete}`,
                {
                    params: {
                        username: user?.username,
                        token: user?.token,
                    },
                }
            );
            
            // Update the announcements list
            await fetchAnnouncements();
            setDeleteDialogOpen(false);
            setAnnouncementToDelete(null);
        } catch (error) {
            captureException(error);
            console.error("Error deleting announcement:", error);
        }
    };

    const handleTogglePin = async (announcementId) => {
        try {
            await axios.put(
                `/api/observatories/${observatory._id}/announcements/${announcementId}/pin`,
                {},
                {
                    params: {
                        username: user?.username,
                        token: user?.token,
                    },
                }
            );
            
            // Update the announcements list
            await fetchAnnouncements();
        } catch (error) {
            captureException(error);
            console.error("Error toggling pin status:", error);
        }
    };

    const handleEditClick = (announcement) => {
        setCurrentAnnouncement(announcement);
        setShowForm(true);
    };

    const handleDeleteClick = (announcementId) => {
        setAnnouncementToDelete(announcementId);
        setDeleteDialogOpen(true);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setCurrentAnnouncement(null);
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
                
                {!showForm && (
                    <Button 
                        variant="contained" 
                        startIcon={<AddIcon />}
                        onClick={() => setShowForm(true)}
                    >
                        New Announcement
                    </Button>
                )}
            </Box>
            
            {showForm ? (
                <Paper sx={{ p: 3, mb: 3, backgroundColor: palette.common.black }}>
                    <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        {currentAnnouncement ? "Edit Announcement" : "Create New Announcement"}
                    </Typography>
                    
                    <AnnouncementForm 
                        announcement={currentAnnouncement}
                        onSubmit={currentAnnouncement ? handleUpdateAnnouncement : handleCreateAnnouncement}
                        onCancel={handleFormCancel}
                    />
                </Paper>
            ) : (
                <>
                    {loading ? (
                        <Typography>Loading announcements...</Typography>
                    ) : announcements.length === 0 ? (
                        <Typography>
                            No announcements yet. Create your first announcement to keep your users informed.
                        </Typography>
                    ) : (
                        <Box>
                            {announcements.map(announcement => (
                                <AnnouncementItem 
                                    key={announcement._id}
                                    announcement={announcement}
                                    onEdit={handleEditClick}
                                    onDelete={handleDeleteClick}
                                    onTogglePin={handleTogglePin}
                                />
                            ))}
                        </Box>
                    )}
                </>
            )}
            
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Announcement</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this announcement? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleDeleteAnnouncement} 
                        color="error"
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ObservatorySettingAnnouncements;
