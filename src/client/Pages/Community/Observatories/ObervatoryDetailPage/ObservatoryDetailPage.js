import React, { useEffect, useState, useCallback } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import PageContainer from "@components/global/PageContainer";
import ObservatoryPageContextProvider, { useObservatoryPageContext } from "./ObservatoryPageContext";
import ObservatoryPreview from "./ObservatoryPreview";
import EquipmentPreview from "./EquipmentPreview";
import { useLocation } from "react-router-dom";
import { useBreadcrumbContext } from "@components/providers/BreadcrumbProvider";
import ObservatoryCalendar from "./ObservatoryCalendar";
import ObservatorySetting from "./ObservatorySetting";
import ObservatoryAnnouncements from "./ObservatoryAnnouncements";
import ObservatoryGuidelines from "./ObservatoryGuidelines";
import WarningIcon from "@mui/icons-material/Warning";
import { useTheme } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { captureException } from "@sentry/browser";
import { wssMessageSocketActions, wssMediaSocketActions } from "@redux/actions";
import { selectConnectedKStarInstances } from "@redux/selectors";
import useActiveUser from "@hooks/useActiveUser";
import ObservatoryLinkModal from "../../../../views/Setup/EkosInstanceSelector/ObservatoryLinkModal";
import { Palette } from "@common/shared/common/styles";

const ObservatoryDetail = () =>
{
    const { palette } = useTheme();
    const dispatch = useDispatch();
    const user = useActiveUser();
    const connectedKStarsInstances = useSelector(selectConnectedKStarInstances);
    const [showBooking, setShowBooking] = useState(false);
    const [showSetting, setShowSetting] = useState(false);
    const [showAnnouncements, setShowAnnouncements] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(false);
    const [isLinkMenuOpen, setIsLinkMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {observatoryPermissions, observatory, setObservatory} = useObservatoryPageContext();
    
    const isConnectedToKStar = connectedKStarsInstances?.some(
        (kstar) => kstar.machineID === observatory?.machine_id
    );

    const closeLinkMenu = useCallback(
        () => setIsLinkMenuOpen(false),
        [setIsLinkMenuOpen],
    );

    const handleLinkClick = useCallback(
        () => setIsLinkMenuOpen(true),
        [setIsLinkMenuOpen],
    );

    const updateObservatory = useCallback(
        async (machine_id) => {
            if (!observatory || !user) return;
            
            setIsLoading(true);
            try {
                const observatoryData = new FormData();
                observatoryData.append("machine_id", machine_id);
                
                const { data } = await axios.patch(
                    `/api/observatories/${observatory?._id}`,
                    observatoryData,
                    {
                        params: {
                            username: user?.username,
                            token: user?.token,
                        },
                    },
                );
                setObservatory(data.observatory);
                setIsLinkMenuOpen(false);
            } catch (error) {
                captureException(error);
            } finally {
                setIsLoading(false);
            }
        },
        [observatory, user, setObservatory, dispatch],
    );

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xxs: "auto", md: "1fr auto" },
                alignItems: "flex-start",
                gap: "1.5rem",
                padding: { xxs: ".75rem", md: "1rem", lg: "1.5rem" },
                marginTop: { xxs: "1rem", md: 0 },
            }}
        >
            {!observatory?.machine_id && observatoryPermissions?.isOwner && !isLinkMenuOpen && (
                <Box sx={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'warning.main',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    zIndex: 9000,
                    textAlign: 'center',
                    minWidth: '300px'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                        <WarningIcon sx={{ color: palette.white[900], fontSize: '24px' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Warning</Typography>
                    </Box>
                    <Typography sx={{ mb: 3 }}>Observatory is not connected to KStars. Tap to select</Typography>
                    
                    <Button
                        variant="outlined"
                        onClick={handleLinkClick}
                        disabled={isLoading}
                        startIcon={<WarningIcon />}
                        sx={{
                            backgroundColor: Palette.darkRed,
                            borderColor: Palette.darkRed,
                            color: palette.white,
                            '&:hover': {
                                backgroundColor: 'rgba(138, 20, 20, 0.8)',
                                borderColor: Palette.darkRed,
                            },
                            fontWeight: 'bold'
                        }}
                    >
                        No Observatory
                    </Button>
                </Box>
            )}
            {showAnnouncements ? (
                <ObservatoryAnnouncements onClose={() => setShowAnnouncements(false)} />
            ) : observatoryPermissions?.isOwner 
                ? showSetting 
                    ? <ObservatorySetting />  
                    : <EquipmentPreview />
                : showBooking 
                    ? <ObservatoryCalendar /> 
                    : <EquipmentPreview />
            }
            <ObservatoryPreview 
                onBookingToggle={setShowBooking} 
                showBooking={showBooking} 
                onSettingToggle={setShowSetting} 
                showSetting={showSetting}
                onAnnouncementToggle={setShowAnnouncements}
                showAnnouncements={showAnnouncements}
                onGuidelinesToggle={setShowGuidelines}
            />
            {showGuidelines && (
                <ObservatoryGuidelines 
                    open={showGuidelines}
                    onClose={() => setShowGuidelines(false)}
                    guidelines={observatory?.usageGuidelines}
                />
            )}
            
            <ObservatoryLinkModal
                close={closeLinkMenu}
                open={isLinkMenuOpen}
                submit={updateObservatory}
                initialValue={observatory?.machine_id}
                isLoading={isLoading}
                modalProps={{ 
                    style: { zIndex: 9999 }
                }}
            />
        </Box>
	);
};

export default ObservatoryDetail;
