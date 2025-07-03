const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const BookingModel = require('../models/observatory/booking');
const UserModel = require('../models/user');
const NotificationModel = require('../models/notification');
const BookingLogModel = require('../models/observatory/bookingLog');
const logger = require('../logger');
const {
  smtp_host,
  smtp_port,
  smtp_user,
  smtp_pass,
  smtp_from_name,
  smtp_from_email,
  app_url,
  reminder_delay_hours,
  home
} = require('../config');
const nameConvertorForURL = require('../utils/nameConvertorForURL');
const { wssMessageManager } = require('../websocket');

// Store for reminders
const REMINDERS_FILE = path.join(home, '.local/share/ekoslive/reminders.json');

let reminders = [];

// Load existing reminders
function loadReminders()
{
  try
  {
    if (fs.existsSync(REMINDERS_FILE))
    {
      reminders = JSON.parse(fs.readFileSync(REMINDERS_FILE, 'utf8'));
      logger.info(`Loaded ${reminders.length} reminders`);
    } else
    {
      // Create directory if it doesn't exist
      const dir = path.dirname(REMINDERS_FILE);
      if (!fs.existsSync(dir))
      {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(REMINDERS_FILE, JSON.stringify([]));
      logger.info('Created empty reminders file');
    }
  } catch (error)
  {
    logger.error("Error loading reminders", error, {
      operation: "loadReminders",
      remindersFile: REMINDERS_FILE
    });
    reminders = [];
  }
}

// Save reminders to file
function saveReminders()
{
  try
  {
    const dir = path.dirname(REMINDERS_FILE);
    if (!fs.existsSync(dir))
    {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REMINDERS_FILE, JSON.stringify(reminders, null, 2));
  } catch (error)
  {
    logger.error("Error saving reminders", error, {
      operation: "saveReminders",
      remindersFile: REMINDERS_FILE
    });
  }
}

// Schedule a reminder
async function scheduleReminder(booking, owner, renter, referenceNumber, delayHours)
{
  try
  {
    // Schedule the first reminder (24 hours after booking creation)
    const reminderSendTime = new Date();
    // Set reminder to 24 hours after booking creation
    reminderSendTime.setHours(reminderSendTime.getHours() + delayHours);

    const reminder = {
      id: `reminder-${booking._id}-${Date.now()}`,
      type: 'reminder',
      bookingId: booking._id.toString(),
      ownerId: owner._id.toString(),
      renterId: renter._id.toString(),
      ownerEmail: owner.email,
      renterEmail: renter.email,
      renterNickname: renter.socialAccount.social_nickname,
      ownerNickname: owner.socialAccount.social_nickname,
      referenceNumber,
      sendTime: reminderSendTime.toISOString(),
      sent: false,
      retries: 0
    };

    // Schedule the auto-rejection (48 hours after booking creation)
    const autoRejectSendTime = new Date();
    // Set auto-rejection to 48 hours after booking creation
    autoRejectSendTime.setHours(autoRejectSendTime.getHours() + (delayHours * 2));

    const autoReject = {
      id: `auto-reject-${booking._id}-${Date.now()}`,
      type: 'auto-reject',
      bookingId: booking._id.toString(),
      ownerId: owner._id.toString(),
      renterId: renter._id.toString(),
      ownerEmail: owner.email,
      renterEmail: renter.email,
      renterNickname: renter.socialAccount.social_nickname,
      ownerNickname: owner.socialAccount.social_nickname,
      referenceNumber,
      sendTime: autoRejectSendTime.toISOString(),
      sent: false,
      retries: 0
    };

    reminders.push(reminder);
    reminders.push(autoReject);
    saveReminders();
    logger.info(`Reminder scheduled for booking ${booking._id} at ${reminderSendTime}`);
    logger.info(`Auto-rejection scheduled for booking ${booking._id} at ${autoRejectSendTime}`);
    return true;
  } catch (error)
  {
    logger.error("Error scheduling reminder", error, {
      operation: "scheduleReminder",
      bookingId: booking._id,
      ownerId: owner._id,
      renterId: renter._id,
      referenceNumber,
      delayHours
    });
    return false;
  }
}

// Get target usernames (copied from ObservatoryController)
async function getTargetUserNames(targetUserIds)
{
  const targetUserNames = await Promise.all(
    targetUserIds.map(async (item) =>
    {
      const targetUser = await UserModel.findOne({ socialAccount: item });
      if (!targetUser) return null;
      return targetUser.username;
    }),
  );
  return targetUserNames.filter((username) => !!username);
}

// Generate email template (copied from ObservatoryController)
async function generateEmailTemplate(title, recipientName, message, buttonText, buttonUrl)
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

// Process reminders
async function processReminders()
{
  const now = new Date();
  let hasChanges = false;

  for (let i = 0; i < reminders.length; i++)
  {
    const reminder = reminders[i];

    // Skip if already sent or not due yet
    if (reminder.sent || new Date(reminder.sendTime) > now)
    {
      continue;
    }

    try
    {
      // Check if booking is still pending
      const booking = await BookingModel.findById(reminder.bookingId);
      if (!booking || booking.status !== 'pending')
      {
        reminder.sent = true;
        hasChanges = true;
        logger.info(`Skipping ${reminder.type} for booking ${reminder.bookingId} as it's no longer pending`);
        continue;
      }

      // Process based on reminder type
      if (reminder.type === 'reminder')
      {
        await processReminderEmail(reminder, booking);
      } else if (reminder.type === 'auto-reject')
      {
        await processAutoRejection(reminder, booking);
      }

      reminder.sent = true;
      hasChanges = true;
    } catch (error)
    {
      logger.error("Error processing reminder", error, {
        operation: "processReminders",
        reminderType: reminder.type,
        reminderId: reminder.id,
        bookingId: reminder.bookingId
      });
      reminder.retries++;

      // Mark as sent after 3 retries
      if (reminder.retries >= 3)
      {
        reminder.sent = true;
        logger.warn(`Marking ${reminder.type} ${reminder.id} as sent after 3 failed attempts`);
      }

      hasChanges = true;
    }
  }

  // Save changes if any
  if (hasChanges)
  {
    saveReminders();
  }

  // Clean up old reminders (sent more than 7 days ago)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  const oldRemindersCount = reminders.length;
  reminders = reminders.filter(r => !r.sent || new Date(r.sendTime) > cutoff);

  if (reminders.length < oldRemindersCount)
  {
    saveReminders();
    logger.info(`Cleaned up ${oldRemindersCount - reminders.length} old reminders`);
  }
}

// Process reminder email
async function processReminderEmail(reminder, booking)
{
  // Send reminder email
  const transporter = nodemailer.createTransport({
    host: smtp_host,
    port: smtp_port,
    secure: false,
    auth: {
      user: smtp_user,
      pass: smtp_pass,
    },
  });

  const reminderEmailHtml = await generateEmailTemplate(
    'Booking Request Reminder',
    reminder.ownerNickname,
    `This is a reminder that you have a pending booking request from <strong>${reminder.renterNickname}</strong>.<br><br>
    <strong>Booking Reference:</strong> ${reminder.referenceNumber}<br>
    Please review the request at your earliest convenience. The booking request will expire after 24 hours.`,

    'View Booking Request',
    `${app_url}community/bookings/${nameConvertorForURL(reminder.renterNickname)}-${reminder.bookingId}`
  );

  await transporter.sendMail({
    from: {
      name: smtp_from_name,
      address: smtp_from_email,
    },
    to: reminder.ownerEmail,
    subject: `Reminder: Pending Booking Request - Ref: ${reminder.referenceNumber}`,
    text: `Hello ${reminder.ownerNickname},
This is a reminder that you have a pending booking request from ${reminder.renterNickname}.
Booking Reference: ${reminder.referenceNumber}
Please go to the following link to view the booking request:
${app_url}community/bookings/${nameConvertorForURL(reminder.renterNickname)}-${reminder.bookingId}`,
    html: reminderEmailHtml
  });

  // Create reminder notification
  const owner = await UserModel.findById(reminder.ownerId).populate("socialAccount");

  if (owner && owner.socialAccount)
  {
    const reminderNotification = await NotificationModel.create({
      type: "REMINDER",
      content: `Reminder: You have a pending booking request from ${reminder.renterNickname}. Ref: ${reminder.referenceNumber}`,
      target_users: [owner.socialAccount._id],
      read_users: [],
      channel: "COMMUNITY",
      role: "REGISTERED",
      actions: [{ type: "Booking" }],
    });

    const targetUserNames = await getTargetUserNames([owner.socialAccount._id]);
    wssMessageManager.sendMessageByUsernames(targetUserNames, {
      notification: reminderNotification,
      type: "new_unread_notification",
    });
  }

  // Log the reminder
  await BookingLogModel.create({
    source: 'SYSTEM',
    destination: reminder.ownerId,
    status: 'reminder',
    notes: `Reminder sent to owner for booking reference: ${reminder.referenceNumber}`,
  });

  logger.info(`Reminder email sent for booking ${reminder.bookingId}`);
}

// Process auto-rejection
async function processAutoRejection(reminder, booking)
{
  logger.info(`Auto-rejecting booking ${reminder.bookingId} due to inactivity`);

  // Update booking status to rejected
  booking.status = 'rejected';
  booking.dates = booking.dates.map(date =>
  {
    return {
      ...date.toObject(),
      status: 'rejected'
    };
  });
  await booking.save();

  // Create transporter for emails
  const transporter = nodemailer.createTransport({
    host: smtp_host,
    port: smtp_port,
    secure: false,
    auth: {
      user: smtp_user,
      pass: smtp_pass,
    },
  });

  // Get owner and renter details
  const owner = await UserModel.findById(reminder.ownerId).populate("socialAccount");
  const renter = await UserModel.findById(reminder.renterId).populate("socialAccount");

  if (!owner || !renter)
  {
    logger.error("Could not find owner or renter for booking", new Error("Owner or renter not found"), {
      operation: "processAutoRejection",
      bookingId: reminder.bookingId,
      ownerId: reminder.ownerId,
      renterId: reminder.renterId
    });
    return;
  }

  // Send email to owner
  const ownerEmailHtml = await generateEmailTemplate(
    'Booking Request Auto-Rejected',
    reminder.ownerNickname,
    `A booking request from <strong>${reminder.renterNickname}</strong> has been automatically rejected due to inactivity.<br><br>
    <strong>Booking Reference:</strong> ${reminder.referenceNumber}<br>
    The system has automatically rejected this booking request as no action was taken within 48 hours.`,
    'View Booking Details',
    `${app_url}community/bookings/${nameConvertorForURL(reminder.renterNickname)}-${reminder.bookingId}`
  );

  await transporter.sendMail({
    from: {
      name: smtp_from_name,
      address: smtp_from_email,
    },
    to: reminder.ownerEmail,
    subject: `Booking Request Auto-Rejected - Ref: ${reminder.referenceNumber}`,
    text: `Hello ${reminder.ownerNickname},
A booking request from ${reminder.renterNickname} has been automatically rejected due to inactivity.
Booking Reference: ${reminder.referenceNumber}
The system has automatically rejected this booking request as no action was taken within 48 hours.
${app_url}community/bookings/${nameConvertorForURL(reminder.renterNickname)}-${reminder.bookingId}`,
    html: ownerEmailHtml
  });

  // Send email to renter
  const renterEmailHtml = await generateEmailTemplate(
    'Booking Request Auto-Rejected',
    reminder.renterNickname,
    `Your booking request for <strong>${reminder.ownerNickname}'s</strong> observatory has been automatically rejected.<br><br>
    <strong>Booking Reference:</strong> ${reminder.referenceNumber}<br>
    The system has automatically rejected this booking request as the owner did not take any action within 48 hours.`,
    'View Booking Details',
    `${app_url}community/bookings/${nameConvertorForURL(reminder.renterNickname)}-${reminder.bookingId}`
  );

  await transporter.sendMail({
    from: {
      name: smtp_from_name,
      address: smtp_from_email,
    },
    to: reminder.renterEmail,
    subject: `Booking Request Auto-Rejected - Ref: ${reminder.referenceNumber}`,
    text: `Hello ${reminder.renterNickname},
Your booking request for ${reminder.ownerNickname}'s observatory has been automatically rejected.
Booking Reference: ${reminder.referenceNumber}
The system has automatically rejected this booking request as the owner did not take any action within 48 hours.
${app_url}community/bookings/${nameConvertorForURL(reminder.renterNickname)}-${reminder.bookingId}`,
    html: renterEmailHtml
  });

  // Create notifications for both owner and renter
  if (owner.socialAccount)
  {
    const ownerNotification = await NotificationModel.create({
      type: "REJECTED",
      content: `Booking request from ${reminder.renterNickname} was automatically rejected due to inactivity. Ref: ${reminder.referenceNumber}`,
      target_users: [owner.socialAccount._id],
      read_users: [],
      channel: "COMMUNITY",
      role: "REGISTERED",
      actions: [{ type: "Booking" }],
    });

    const ownerUserNames = await getTargetUserNames([owner.socialAccount._id]);
    wssMessageManager.sendMessageByUsernames(ownerUserNames, {
      notification: ownerNotification,
      type: "new_unread_notification",
    });
  }

  if (renter.socialAccount)
  {
    const renterNotification = await NotificationModel.create({
      type: "REJECTED",
      content: `Your booking request for ${reminder.ownerNickname}'s observatory was automatically rejected due to inactivity. Ref: ${reminder.referenceNumber}`,
      target_users: [renter.socialAccount._id],
      read_users: [],
      channel: "COMMUNITY",
      role: "REGISTERED",
      actions: [{ type: "Booking" }],
    });

    const renterUserNames = await getTargetUserNames([renter.socialAccount._id]);
    wssMessageManager.sendMessageByUsernames(renterUserNames, {
      notification: renterNotification,
      type: "new_unread_notification",
    });
  }

  // Log the auto-rejection
  await BookingLogModel.create({
    source: 'SYSTEM',
    destination: reminder.ownerId,
    status: 'rejected',
    notes: `Booking automatically rejected due to owner inactivity. Reference: ${reminder.referenceNumber}`,
  });

  await BookingLogModel.create({
    source: 'SYSTEM',
    destination: reminder.renterId,
    status: 'rejected',
    notes: `Booking automatically rejected due to owner inactivity. Reference: ${reminder.referenceNumber}`,
  });

  logger.info(`Auto-rejection completed for booking ${reminder.bookingId}`);
}

// Start the cron job
function start()
{
  loadReminders();

  // Run every minute
  cron.schedule('* * * * *', () =>
  {
    processReminders().catch(err =>
    {
      logger.error("Error in reminder cron job", err, {
        operation: "reminderCronJob"
      });
    });
  });

  logger.info('Reminder service started');
}

module.exports = {
  scheduleReminder,
  start
};
