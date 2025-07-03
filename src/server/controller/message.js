const MessageModel = require("../models/message");
const SocialModel = require("../models/social");
const UserModel = require("../models/user");
const findOwner = require("../utils/findOwner");
const logger = require("../logger");

class MessageController {
  /**
   * Get conversations for a user
   * A conversation is a group of messages between two users
   */
  async getConversations(username) {
    try {
      const owner = await findOwner(username);
      if (!owner || !owner.socialAccount) throw new Error("User not found or has no social profile");
      
      // Find all messages where user is either sender or receiver
      const messages = await MessageModel.aggregate([
        {
          $match: {
            $or: [
              { sender: owner.socialAccount },
              { receiver: owner.socialAccount }
            ]
          }
        },
        // Sort by createdAt in descending order
        { $sort: { createdAt: -1 } },
        // Group by the conversation partner
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$sender", owner.socialAccount] },
                "$receiver",
                "$sender"
              ]
            },
            lastMessage: { $first: "$content" },
            lastTime: { $first: "$createdAt" },
            unreadCount: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ["$receiver", owner.socialAccount] },
                    { $eq: ["$read", false] }
                  ]},
                  1,
                  0
                ]
              }
            },
            lastMessageId: { $first: "$_id" }
          }
        }
      ]);
      
      // Populate conversation partner details
      const conversationsWithDetails = await Promise.all(
        messages.map(async (conversation) => {
          const partner = await SocialModel.findById(conversation._id);
          if (!partner) return null;
          
          // Get the user associated with this social profile to check online status
          const partnerUser = await UserModel.findOne({ socialAccount: partner._id })
            .select('username connected');
          
          return {
            id: partner._id,
            name: partner.full_name || partner.social_nickname || partnerUser?.username || "Unknown User",
            avatar: partner.avatar || "",
            unreadCount: conversation.unreadCount,
            lastMessage: conversation.lastMessage,
            lastTime: conversation.lastTime,
            lastMessageId: conversation.lastMessageId,
            isOnline: Boolean(partnerUser?.connected) // Use the actual user's connected status
          };
        })
      );
      
      // Filter out any null values and sort by lastTime
      return conversationsWithDetails
        .filter(conv => conv !== null)
        .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      
    } catch (error) {
      logger.error("Error getting conversations", error, { username });
      throw error;
    }
  }
  
  /**
   * Get messages between two users
   */
  async getMessages(username, partnerId) {
    try {
      const owner = await findOwner(username);
      if (!owner || !owner.socialAccount) throw new Error("User not found or has no social profile");
      
      const messages = await MessageModel.find({
        $or: [
          { sender: owner.socialAccount, receiver: partnerId },
          { sender: partnerId, receiver: owner.socialAccount }
        ]
      })
      .sort({ createdAt: 1 })
      .lean();
      
      // Mark unread messages as read
      await MessageModel.updateMany(
        { 
          sender: partnerId, 
          receiver: owner.socialAccount,
          read: false
        },
        { $set: { read: true } }
      );
      
      // Check if there are any pending messages that need approval
      const pendingCount = await MessageModel.countDocuments({
        $or: [
          { sender: partnerId, receiver: owner.socialAccount, approvalStatus: 'pending' },
          { sender: owner.socialAccount, receiver: partnerId, approvalStatus: 'pending' }
        ]
      });
      
      const formattedMessages = messages.map(message => ({
        id: message._id,
        senderId: message.sender.equals(owner.socialAccount) ? 'self' : partnerId,
        text: message.content,
        timestamp: new Date(message.createdAt).toLocaleString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        read: message.read,
        attachment: message.attachment,
        approvalStatus: message.approvalStatus,
        approved: message.approved
      }));
      
      // Return in the format expected by the client
      return {
        messages: formattedMessages,
        hasPendingMessages: pendingCount > 0
      };
      
    } catch (error) {
      logger.error("Error getting messages", error, { username, partnerId });
      throw error;
    }
  }
  
  /**
   * Send a message from one user to another
   */
  async sendMessage(senderUsername, receiverUsername, content, attachment = null) {
    try {
      // Get sender details
      const sender = await findOwner(senderUsername);
      if (!sender || !sender.socialAccount) throw new Error("Sender not found or has no social profile");
      
      // Get receiver details - can be social_nickname or username
      let receiver;
      // Check if it's a social nickname (with or without @)
      const cleanReceiverUsername = receiverUsername.startsWith('@') 
        ? receiverUsername.substring(1) 
        : receiverUsername;
        
      // First try to find by social_nickname
      const socialProfile = await SocialModel.findOne({
        social_nickname: { $in: [cleanReceiverUsername, `@${cleanReceiverUsername}`] }
      });
      
      if (socialProfile) {
        // Find the user who owns this social profile
        receiver = await UserModel.findOne({ socialAccount: socialProfile._id });
      } else {
        // Try to find by username
        receiver = await findOwner(cleanReceiverUsername);
      }
      
      if (!receiver || !receiver.socialAccount) throw new Error("Receiver not found or has no social profile");
      
      // Check if this is the first message between these users
      const existingMessages = await MessageModel.find({
        $or: [
          { sender: sender.socialAccount, receiver: receiver.socialAccount },
          { sender: receiver.socialAccount, receiver: sender.socialAccount }
        ]
      }).limit(1);
      
      const isFirstMessage = existingMessages.length === 0;
      
      // Determine approval status
      const bookingApprovalRegex = /^Your booking request for ".*" has been approved\..*Reference: \w+/i;
      const isBookingApproval = bookingApprovalRegex.test(content?.trim() || '');
      
      let approvalStatus = 'approved';
      let approved = true;

      if (isFirstMessage) {
        if (isBookingApproval) {
          // Auto-approve booking confirmation messages
          approvalStatus = 'approved';
          approved = true;
        } else {
          // First messages need approval
          approvalStatus = 'pending';
          approved = false;
        }
      } else {
        // For subsequent messages, check if conversation is already approved
        const hasApprovedMessages = await MessageModel.exists({
          $or: [
            { sender: sender.socialAccount, receiver: receiver.socialAccount, approved: true },
            { sender: receiver.socialAccount, receiver: sender.socialAccount, approved: true }
          ]
        });
        
        if (!hasApprovedMessages) {
          approvalStatus = 'pending';
          approved = false;
        }
      }
      
      // Create the message
      const message = await MessageModel.create({
        sender: sender.socialAccount,
        receiver: receiver.socialAccount,
        content,
        attachment,
        read: false,
        approved,
        approvalStatus,
        isFirstMessage
      });
      
      return {
        id: message._id,
        senderId: 'self',
        receiverId: receiver.socialAccount,
        receiverUsername: receiver.username,
        text: message.content,
        timestamp: new Date(message.createdAt).toLocaleString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        read: message.read,
        approved,
        approvalStatus,
        isFirstMessage
      };
      
    } catch (error) {
      logger.error("Error sending message", error, { 
        senderUsername, 
        receiverUsername,
        contentLength: content?.length || 0
      });
      throw error;
    }
  }
  
  /**
   * Get unread message count for a user
   */
  async getUnreadCount(username) {
    try {
      const owner = await findOwner(username);
      if (!owner || !owner.socialAccount) throw new Error("User not found or has no social profile");
      
      const count = await MessageModel.countDocuments({
        receiver: owner.socialAccount,
        read: false
      });
      
      return { count };
      
    } catch (error) {
      logger.error("Error getting unread count", error, { username });
      throw error;
    }
  }

  /**
   * Get all contacts of a user (people they've had conversations with)
   */
  async getContacts(username) {
    try {
      // First get all conversations to extract contact information
      const conversations = await this.getConversations(username);
      
      // Return just the contact information from conversations
      return conversations.map(conversation => ({
        id: conversation.id,
        name: conversation.name,
        avatar: conversation.avatar
      }));
      
    } catch (error) {
      logger.error("Error getting contacts", error, { username });
      throw error;
    }
  }

  async getPendingMessages(username) {
    try {
      const owner = await findOwner(username);
      if (!owner || !owner.socialAccount) throw new Error("User not found or has no social profile");

      const messages = await MessageModel.find({
        receiver: owner.socialAccount,
        read: false
      });

      return messages.length;
    }
    catch (error) {
      logger.error("Error getting pending messages", error, { username });
      throw error;
    }
  }

  /**
   * Get pending message requests for a user
   */
  async getPendingRequests(username) {
    try {
      const owner = await findOwner(username);
      if (!owner || !owner.socialAccount) throw new Error("User not found or has no social profile");
      
      // Find all pending first messages sent to this user
      const pendingMessages = await MessageModel.find({
        receiver: owner.socialAccount,
        approvalStatus: 'pending',
        isFirstMessage: true
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'full_name social_nickname avatar')
      .lean();
      
      // Format the messages for the frontend
      return Promise.all(pendingMessages.map(async (message) => {
        // Get the sender's username
        const senderUser = await UserModel.findOne({ socialAccount: message.sender._id })
          .select('username connected');
          
        return {
          id: message._id,
          senderId: message.sender._id,
          senderName: message.sender.full_name || message.sender.social_nickname || senderUser?.username || "Unknown User",
          senderAvatar: message.sender.avatar || "",
          text: message.content,
          timestamp: new Date(message.createdAt).toLocaleString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          isOnline: Boolean(senderUser?.connected)
        };
      }));
      
    } catch (error) {
      logger.error("Error getting pending requests", error, { username });
      throw error;
    }
  }

  /**
   * Approve or reject a message request
   */
  async respondToRequest(username, messageId, action) {
    try {
      const owner = await findOwner(username);
      if (!owner || !owner.socialAccount) throw new Error("User not found or has no social profile");
      
      // Find the message
      const message = await MessageModel.findById(messageId);
      if (!message) throw new Error("Message not found");
      
      // Verify this message was sent to the current user
      if (!message.receiver.equals(owner.socialAccount)) {
        throw new Error("You don't have permission to approve/reject this message");
      }
      
      // Update the message based on the action
      if (action === 'approve') {
        // Approve this message and all pending messages in this conversation
        await MessageModel.updateMany(
          {
            $or: [
              { sender: message.sender, receiver: message.receiver },
              { sender: message.receiver, receiver: message.sender }
            ],
            approvalStatus: 'pending'
          },
          {
            $set: {
              approved: true,
              approvalStatus: 'approved'
            }
          }
        );
        
        return { success: true, action: 'approved' };
      } 
      else if (action === 'reject') {
        // Reject just this specific message
        message.approved = false;
        message.approvalStatus = 'rejected';
        await message.save();
        
        return { success: true, action: 'rejected' };
      }
      else {
        throw new Error("Invalid action. Must be 'approve' or 'reject'");
      }
      
    } catch (error) {
      logger.error("Error responding to request", error, { 
        username, 
        messageId, 
        action 
      });
      throw error;
    }
  }
}

module.exports = new MessageController();
