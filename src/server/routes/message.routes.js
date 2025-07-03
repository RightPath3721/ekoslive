const express = require('express');
const logger = require('../logger');
const authMiddleware = require('../middlewares/auth');
const MessageController = require('../controller/message');
const wssManager = require('../websocket/wssMessageServerManager');
const UserModel = require('../models/user');
const SocialModel = require('../models/social');
const MessageModel = require('../models/message');
const NotificationModel = require('../models/notification');

const MessageRoutes = express.Router();
const { wssMessageManager } = require("../websocket");

// Get all conversations for a user
MessageRoutes.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const conversations = await MessageController.getConversations(username);
    
    // // When mapping conversation partner details
    // const conversationsWithDetails = await Promise.all(
    //   conversations.map(async (conversation) => {
    //     // const partner = await SocialModel.findById(conversation.receiver);
    //     // if (!partner) return null;
        
    //     // Get user document to check connected status
    //     const partnerUser = await UserModel.findOne({ socialAccount: conversation.receiver })
    //       .select('connected username');
        
    //     return {
    //       id: partner._id,
    //       name: partnerUser?.username || "Unknown User",
    //       avatar: partner.avatar || "",
    //       unreadCount: conversation.unreadCount,
    //       lastMessage: conversation.lastMessage,
    //       lastTime: conversation.lastTime,
    //       lastMessageId: conversation.lastMessageId,
    //       isOnline: Boolean(partnerUser?.connected) // Include online status
    //     };
    //   })
    // );
    
    // res.json(conversationsWithDetails);
    res.json(conversations);
  } catch (error) {
    logger.error("Error getting conversations", error, {
      username,
      operation: "getConversations"
    });
    res.status(400).json({ message: error.message });
  }
});

// Get messages between two users
MessageRoutes.get('/messages/:partnerId', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const { partnerId } = req.params;
    
    const result = await MessageController.getMessages(username, partnerId);
    
    res.json(result);
  } catch (error) {
    logger.error("Error getting messages", error, {
      username,
      operation: "getMessages",
      partnerId
    });
    res.status(400).json({ message: error.message });
  }
});

// Get pending message requests
MessageRoutes.get('/requests/pending', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    
    const pendingRequests = await MessageController.getPendingRequests(username);
    
    res.json(pendingRequests);
  } catch (error) {
    logger.error("Error getting pending requests", error, {
      username,
      operation: "getPendingRequests"
    });
    res.status(400).json({ message: error.message });
  }
});

// Respond to a message request (approve/reject)
MessageRoutes.post('/requests/respond', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const { messageId, action } = req.body;
    
    if (!messageId || !action) {
      return res.status(400).json({ message: "Message ID and action are required" });
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
    }
    
    const result = await MessageController.respondToRequest(username, messageId, action);
    
    // Try to notify the sender via WebSocket
    try {
      const message = await MessageModel.findById(messageId);
      if (message) {
        const senderUser = await UserModel.findOne({ socialAccount: message.sender });
        if (senderUser) {
          wssMessageManager.sendMessageByUsername(senderUser.username, {
            type: "message_request_response",
            payload: {
              messageId,
              action,
              receiverUsername: username
            }
          });
          
          // If the action is 'approve', also send the message to the receiver
          if (action === 'approve') {
            // Get the receiver user
            const receiverUser = await UserModel.findOne({ username });
            if (receiverUser) {
              // Format the message for the receiver
              wssMessageManager.sendMessageByUsername(username, {
                type: "new_message",
                payload: {
                  id: message._id,
                  senderId: message.sender,
                  receiverId: message.receiver,
                  text: message.content,
                  timestamp: message.createdAt,
                  senderName: senderUser.username,
                  status: "received"
                }
              });
            }
          }
          
          // Create a global notification for the sender about the request response
          const receiverUser = await UserModel.findOne({ username }).populate('socialAccount');
          
          if (senderUser && receiverUser) {
            // Create notification
            const notification = await NotificationModel.create({
              type: "MESSAGE",
              content: action === 'approve' 
                ? `${receiverUser.socialAccount.social_nickname || username} approved your message request.` 
                : `${receiverUser.socialAccount.social_nickname || username} rejected your message request.`,
              target_users: [senderUser.socialAccount._id],
              read_users: [],
              channel: "COMMUNITY",
              role: "REGISTERED",
              actions: [{ type: "Booking" }],
            });
            
            // Send notification via WebSocket
            wssMessageManager.sendMessageByUsername(senderUser.username, {
              notification,
              type: "new_unread_notification"
            });
          }
        }
      }
    } catch (wsError) {
      // Don't fail if WebSocket notification fails
      logger.warn(`Could not send request response notification: ${wsError.message}`);
    }
    
    res.json(result);
  } catch (error) {
    logger.error("Error responding to request", error, {
      username,
      operation: "respondToRequest",
      messageId,
      action
    });
    res.status(400).json({ message: error.message });
  }
});

// Send a message
MessageRoutes.post('/send', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const { receiverUsername, content, attachment } = req.body;
    
    if (!receiverUsername || !content) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }
    
    const message = await MessageController.sendMessage(
      username, 
      receiverUsername,
      content,
      attachment
    );
    
    // Try to notify the receiver via WebSocket if they're online
    try {
      // First get the actual username of the receiver (in case social_nickname was used)
      const receiverUsername = message.receiverUsername;
      
      // Format the message for our Redux store structure
      const messagePayload = {
        type: "new_message",
        payload: {
          id: message.id,
          senderId: message.senderId === 'self' ? message.receiverId : message.senderId,
          receiverId: message.receiverId,
          text: message.text,
          timestamp: message.timestamp,
          senderName: username,
          status: "sent"
        }
      };
      
      // Send to the receiver
      wssMessageManager.sendMessageByUsername(receiverUsername, messagePayload);
      
      // Also send a copy to the sender to update their state
      wssMessageManager.sendMessageByUsername(username, {
        ...messagePayload,
        type: "message_sent_confirmation"
      });
      
      // If this is a pending message request, send a special notification
      if (message.approvalStatus === 'pending' && message.isFirstMessage) {
        // Send a pending request notification to the receiver
        wssMessageManager.sendMessageByUsername(receiverUsername, {
          type: "new_pending_request",
          payload: {
            id: message.id,
            senderId: message.senderId === 'self' ? message.receiverId : message.senderId,
            senderName: username,
            text: message.text,
            timestamp: message.timestamp
          }
        });
      }
      
      // Create a global notification for the receiver
      const receiverUser = await UserModel.findOne({ username: receiverUsername }).populate('socialAccount');
      const senderUser = await UserModel.findOne({ username }).populate('socialAccount');
      
      if (receiverUser && senderUser) {
        // Create notification
        const notification = await NotificationModel.create({
          type: "MESSAGE",
          content: `${senderUser.socialAccount.social_nickname || username} sent you a message: "${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}"`,
          target_users: [receiverUser.socialAccount._id],
          read_users: [],
          channel: "COMMUNITY",
          role: "REGISTERED",
          actions: [{ type: "Booking" }],
        });
        
        // Send notification via WebSocket
        wssMessageManager.sendMessageByUsername(receiverUsername, {
          notification,
          type: "new_unread_notification"
        });
      }
      
    } catch (wsError) {
      // Don't fail if WebSocket notification fails
      logger.warn(`Could not send WebSocket notification: ${wsError.message}`);
    }
    
    res.json(message);
  } catch (error) {
    logger.error("Error sending message", error, {
      username,
      operation: "sendMessage",
      receiverUsername,
      hasAttachment: !!attachment
    });
    res.status(400).json({ message: error.message });
  }
});

// Get unread message count
MessageRoutes.get('/unread', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const unreadCount = await MessageController.getUnreadCount(username);
    
    res.json(unreadCount);
  } catch (error) {
    logger.error("Error getting unread message count", error, {
      username,
      operation: "getUnreadCount"
    });
    res.status(400).json({ message: error.message });
  }
});

// Search users route (add this to your existing user routes)
MessageRoutes.get('/search', authMiddleware, async (req, res) => {
  try {
    const { query, username } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    // Don't include the requesting user in search results
    const users = await UserModel.find({
      $and: [
        { username: { $ne: username } },
        { 
          $or: [
            { username: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email socialAccount connected lastLogged')
    .populate('socialAccount', 'full_name social_nickname avatar')
    .limit(20);
    
    // Map user data to a more frontend-friendly format
    const mappedUsers = users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      socialAccount: user.socialAccount?._id,
      avatar: user.socialAccount?.avatar,
      full_name: user.socialAccount?.full_name,
      social_nickname: user.socialAccount?.social_nickname,
      connected: user.connected,
      lastLogged: user.lastLogged
    }));
    
    res.json(mappedUsers);
  } catch (error) {
    logger.error("Error searching users", error, {
      operation: "searchUsers",
      query,
      username
    });
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Get pending message requests
MessageRoutes.get("/pending", authMiddleware, async (req, res) =>
{
  try
  {
    const { username } = req.query;
    const messages =
      await MessageController.getPendingMessages(username);

    res.json({ messages: messages });
  }
  catch (error)
  {
    logger.error("Error getting pending messages", error, {
      username,
      operation: "getPendingMessages"
    });
    res.status(400).json({ error: error.message });
  }
});

// Get online status for contacts
MessageRoutes.get('/status', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    
    // Get the requesting user's contacts
    const userContacts = await MessageController.getContacts(username);
    
    // If no contacts, return empty array
    if (!userContacts.length) {
      return res.json([]);
    }
    
    // Get list of usernames
    const contactUsernames = userContacts.map(contact => contact.name);
    
    // Query the database for online status of these users
    const users = await UserModel.find({ 
      username: { $in: contactUsernames } 
    }).select('username connected');
    
    // Format the response
    const statusInfo = users.map(user => ({
      username: user.username,
      isOnline: Boolean(user.connected)
    }));
    
    res.json(statusInfo);
    
  } catch (error) {
    logger.error("Error getting user status", error, {
      username,
      operation: "getUserStatus"
    });
    res.status(500).json({ message: 'Failed to get user status' });
  }
});

// Add a new endpoint to broadcast user status changes
MessageRoutes.post('/status/broadcast', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const { isOnline } = req.body;
    
    // Broadcast status change to all connected users
    if (global.app && global.app.wssManager) {
      global.app.wssManager.broadcastMessage({
        type: "user_status_change",
        payload: {
          username,
          isOnline: Boolean(isOnline)
        }
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error("Error broadcasting status", error, {
      username,
      operation: "broadcastStatus",
      isOnline
    });
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
MessageRoutes.post('/read', authMiddleware, async (req, res) => {
  try {
    const { username } = req.query;
    const { conversationId, messageIds } = req.body;
    
    if (!conversationId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: "Conversation ID and message IDs array are required" });
    }
    
    // Update messages read status in the database
    await MessageController.markMessagesAsRead(username, conversationId, messageIds);
    
    // Try to notify the sender via WebSocket
    try {
      // Get the conversation partner's username
      const conversation = await MessageController.getConversation(username, conversationId);
      if (conversation && conversation.partner) {
        wssMessageManager.sendMessageByUsername(conversation.partner, {
          type: "message_read_confirmation",
          payload: {
            conversationId,
            messageIds
          }
        });
      }
    } catch (wsError) {
      // Don't fail if WebSocket notification fails
      logger.warn(`Could not send read confirmation: ${wsError.message}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error("Error marking messages as read", error, {
      username,
      operation: "markMessagesAsRead",
      conversationId,
      messageCount: messageIds?.length || 0
    });
    res.status(400).json({ message: error.message });
  }
});

module.exports = MessageRoutes;
