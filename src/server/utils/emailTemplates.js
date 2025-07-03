function generateEmailTemplate(title, recipientName, message, buttonText, buttonUrl)
{
    return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); padding: 30px 0; text-align: center;">
            <img src="https://ekoslive.s3.amazonaws.com/logo-white-small.png" 
                 alt="EkosLive Logo" 
                 style="width: 200px; height: auto; margin-bottom: 20px; filter: brightness(0) invert(1);"
            />
            <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; color: #333; margin-bottom: 25px;">Hello <strong>${recipientName}</strong>,</p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">${message}</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${buttonUrl}" 
                   style="background-color: #2196f3; 
                          color: white; 
                          text-decoration: none; 
                          padding: 14px 30px; 
                          border-radius: 50px; 
                          font-size: 16px;
                          font-weight: bold;
                          display: inline-block;
                          transition: background-color 0.3s ease;">
                    ${buttonText}
                </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                You can manage all your observatory bookings from your dashboard.
            </p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #888; margin-bottom: 5px;">Clear skies!</p>
                <p style="color: #888; font-weight: bold;">The EkosLive Team</p>
            </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} EkosLive. All rights reserved.</p>
            <p style="color: #888;">
                This is an automated message, please do not reply to this email.
            </p>
        </div>
    </div>`;
}

module.exports = {
    generateEmailTemplate,
};

