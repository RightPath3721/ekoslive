import { Snackbar, SnackbarContent } from '@mui/material'
import React from 'react'
import
{
    FacebookShareButton,
    FacebookIcon,
    XIcon,
    TwitterShareButton,
    WhatsappShareButton,
    WhatsappIcon,
    EmailShareButton,
    EmailIcon,
} from "react-share"

const LOCAL_STYLES = {
    shareButton: {
        paddingLeft: '5px',
        paddingRight: '5px',
    },
};

const ShareDialog = ({ shareURL }) =>
{
    return (
        <Snackbar
        open={true}
        sx={{position: "absolute", transform: "translate(-110%, 50%)", top: "50%"}}
        >
            <SnackbarContent
                message="Share"
                action={[
                    <FacebookShareButton
                        style={LOCAL_STYLES.shareButton}
                        key="facebook"
                        url={shareURL}
                        quote="Check out this image captured with #StellarMate & #EkosLive"
                    >
                        <FacebookIcon
                            size={32}
                            round
                        />
                    </FacebookShareButton>
                    ,
                    <TwitterShareButton
                        style={LOCAL_STYLES.shareButton}
                        key="twitter"
                        url={shareURL}
                        title="Check out this image captured with #StellarMate & #EkosLive"
                    >
                        <XIcon
                            size={32}
                            round
                        />
                    </TwitterShareButton>,
                    <WhatsappShareButton
                        style={LOCAL_STYLES.shareButton}
                        key="whatsup"
                        url={shareURL}
                        title="Check out this image captured with #StellarMate & #EkosLive"
                    >
                        <WhatsappIcon
                            size={32}
                            round
                        />
                    </WhatsappShareButton>
                    ,
                    <EmailShareButton
                        style={LOCAL_STYLES.shareButton}
                        key="email"
                        url={shareURL}
                        subject="Check out this image captured with #StellarMate & #EkosLive"
                    >
                        <EmailIcon
                            size={32}
                            round
                        />
                    </EmailShareButton>
                    ,
                ]} />
        </Snackbar>
    )
}

export default ShareDialog