import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Alert, useTheme } from '@mui/material';
import { useObservatoryPageContext } from "./ObservatoryPageContext";
import useActiveUser from "@hooks/useActiveUser";
import axios from 'axios';
import RichEditor from "@components/RichEditor";

const ObservatorySettingGuidelines = () => {
    const { observatory, setObservatory } = useObservatoryPageContext();
    const user = useActiveUser();
    const { palette } = useTheme();
    const [guidelines, setGuidelines] = useState(observatory?.usageGuidelines || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    useEffect(() => {
        // Update guidelines when observatory changes
        if (observatory?.usageGuidelines) {
            setGuidelines(observatory.usageGuidelines);
        }
    }, [observatory]);

    const handleSave = async () => {
        if (!observatory || !user) return;
        
        setIsSaving(true);
        setSaveMessage('');
        setSaveStatus('');
        
        try {
            const { data } = await axios.patch(
                `/api/observatories/${observatory?._id}/guidelines`,
                { guidelines },
                {
                    params: {
                        username: user?.username,
                        token: user?.token,
                    },
                }
            );
            
            setObservatory(data.observatory);
            setSaveStatus('success');
            setSaveMessage('Guidelines saved successfully');
            setTimeout(() => {
                setSaveMessage('');
                setSaveStatus('');
            }, 3000);
        } catch (error) {
            setSaveStatus('error');
            setSaveMessage('Error saving guidelines');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setGuidelines(observatory?.usageGuidelines || '');
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Observatory Usage Guidelines</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                These guidelines will be shown to users before they can complete a booking. 
                Provide clear instructions on how to use your observatory.
            </Typography>
            
            {saveMessage && (
                <Alert 
                    severity={saveStatus} 
                    sx={{ mb: 2 }}
                    onClose={() => {
                        setSaveMessage('');
                        setSaveStatus('');
                    }}
                >
                    {saveMessage}
                </Alert>
            )}
            
            <Box sx={{ 
                mb: 2, 
                "& .jodit-container": { 
                    border: `1px solid ${palette.grey.main}`,
                    minHeight: "300px"
                } 
            }}>
                <RichEditor 
                    value={guidelines} 
                    onChange={(newContent) => setGuidelines(newContent)} 
                />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {/* <Button 
                    variant="outlined" 
                    onClick={handleReset}
                    disabled={isSaving}
                >
                    Reset
                </Button> */}
                <Button 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Guidelines'}
                </Button>
            </Box>
        </Paper>
    );
};

export default ObservatorySettingGuidelines;
