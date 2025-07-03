import { messageConstants } from "../constants/messages.constants";
import { WEBSOCKET_MESSAGE } from "redux-websocket";
import commands from "../../commands";

/**
 * Used to manage messages and conversations
 **********Sample in JSON form**********
 * {
  "messages": {
    "conversation123": [
      {
        "id": "msg1",
        "senderId": "user1",
        "text": "Hello there",
        "timestamp": 1710941567147,
        "status": "read"
      }
    ]
  },
  "conversations": [
    {
      "id": "conversation123",
      "name": "John Doe",
      "avatar": "avatar-url",
      "unreadCount": 2,
      "lastMessage": "Hello there",
      "lastTime": 1710941567147,
      "lastMessageId": "msg1",
      "isOnline": true
    }
  ],
  "activeConversation": "conversation123",
  "totalUnreadCount": 5
}
 */
const initialState = {
    // Messages organized by conversation ID
    messages: {},
    
    // List of conversations
    conversations: [],
    
    // Currently active conversation ID
    activeConversation: null,
    
    // Total unread message count
    totalUnreadCount: 0,
    
    // Pending message requests that need approval
    pendingRequests: []
};

export const messages = (state = initialState, action) => {
    switch (action.type) {
        case WEBSOCKET_MESSAGE:
            if (action.payload.event.target.url.includes("/message/user") === false)
                return state;
                
            const message = JSON.parse(action.payload.data);
            
            // Handle new message from WebSocket
            if (message.type === "new_message") {
                const { id, senderId, receiverId, text, timestamp, senderName, status } = message.payload;
                
                // Regex for booking approval message
                const bookingApprovalRegex = /^Your booking request for ".*" has been approved\..*Reference: \w+/i;
                const isBookingApproval = bookingApprovalRegex.test(text?.trim() || '');

                const newMessage = {
                    id,
                    senderId,
                    receiverId,
                    text,
                    timestamp,
                    status: status || "received",
                    // Add approval status based on pattern match or payload
                    approvalStatus: isBookingApproval ? 'approved' : (message.payload.approvalStatus || 'pending'), // Default to pending if not booking approval
                    approved: isBookingApproval ? true : (message.payload.approved || false) // Default to false if not booking approval
                };
                
                // --- Handle incoming new_message ---
                const SENDER_NAME_LOWER_TRIMMED = senderName?.trim().toLowerCase();
                
                // STRICT check: Find index based *only* on trimmed, lowercased name
                const existingConvIndex = state.conversations.findIndex(
                    c => SENDER_NAME_LOWER_TRIMMED && c.name?.trim().toLowerCase() === SENDER_NAME_LOWER_TRIMMED
                );

                let nextConversations = [...state.conversations];
                let nextMessages = { ...state.messages };
                let nextTotalUnreadCount = state.totalUnreadCount;
                let targetConversationIdForMessages; // The ID to use for storing messages

                // Check if a match was found *strictly by name*
                if (existingConvIndex > -1) { 
                    // --- MATCH FOUND BY NAME ---
                    const existingConversation = nextConversations[existingConvIndex];
                    // IMPORTANT: Use the ID from the EXISTING conversation for message storage
                    targetConversationIdForMessages = existingConversation.id; 
                    const isConversationActive = state.activeConversation === targetConversationIdForMessages;

                    // Update the matched conversation
                    const updatedConversation = {
                        ...existingConversation,
                        lastMessage: text,
                        lastTime: timestamp,
                        lastMessageId: id,
                        // Only increment unread if not active
                        unreadCount: isConversationActive ? 0 : (existingConversation.unreadCount || 0) + 1,
                        // Optionally update isOnline status if provided by payload, otherwise keep existing
                        isOnline: message.payload.isOnline !== undefined ? message.payload.isOnline : existingConversation.isOnline,
                        // Ensure the name is updated to the potentially slightly different version from the payload if needed
                        name: senderName || existingConversation.name 
                    };

                    // Remove from current position and add to the front
                    nextConversations.splice(existingConvIndex, 1); // Use the unified index
                    nextConversations.unshift(updatedConversation);

                    // Update total unread count
                    if (!isConversationActive) {
                        nextTotalUnreadCount += 1;
                    }
                } else {
                    // --- NO MATCH FOUND BY NAME --- Create a new conversation
                    // Only create if no match by name was found. Use senderId from payload as the new conversation's ID
                    // and also as the key for storing its messages.
                    targetConversationIdForMessages = senderId; 
                    const newConversation = {
                        id: targetConversationIdForMessages, // Use senderId from payload
                        name: senderName || "Unknown User",
                        avatar: "", // Default avatar
                        unreadCount: 1, // Starts with 1 unread
                        lastMessage: text,
                        lastTime: timestamp,
                        lastMessageId: id,
                        isOnline: message.payload.isOnline !== undefined ? message.payload.isOnline : true, // Use status from payload or default to true
                    };
                    nextConversations.unshift(newConversation); // Add to the front
                    nextTotalUnreadCount += 1; // Increment total unread
                }

                // Add or update the message in the list associated with the determined targetConversationIdForMessages
                const currentMessagesForConv = nextMessages[targetConversationIdForMessages] || [];
                const existingMessageIndex = currentMessagesForConv.findIndex(msg => msg.id === newMessage.id);

                if (existingMessageIndex > -1) {
                    // Message already exists, update it (e.g., status, timestamp)
                    // This prevents duplication when an approved message arrives via WebSocket
                    currentMessagesForConv[existingMessageIndex] = {
                        ...currentMessagesForConv[existingMessageIndex], // Keep existing properties
                        ...newMessage // Overwrite with new data (status, timestamp, etc.)
                    };
                    nextMessages[targetConversationIdForMessages] = [...currentMessagesForConv]; // Assign the updated array
                } else {
                    // Message doesn't exist, add it
                    nextMessages[targetConversationIdForMessages] = [...currentMessagesForConv, newMessage];
                }

                return {
                    ...state,
                    conversations: nextConversations,
                    messages: nextMessages,
                    totalUnreadCount: nextTotalUnreadCount,
                };
                // Removed extra closing brace here
            } else if (message.type === "message_sent_confirmation") {
                // Handle sent message confirmation from server
                const { id, senderId, receiverId, text, timestamp, status } = message.payload;
                const newMessage = {
                    id,
                    senderId: 'self', // Mark as sent by self
                    receiverId,
                    text,
                    timestamp,
                    status: status || "sent"
                };
                
                // Find conversation with the receiver using robust string comparison
                const existingConvIndex = state.conversations.findIndex(c => String(c.id) === String(receiverId));
                
                if (existingConvIndex > -1) {
                    // Update existing conversation
                    const updatedConversations = state.conversations.map((c, index) => {
                        if (index === existingConvIndex) {
                            return {
                                ...c,
                                lastMessage: text,
                                lastTime: timestamp,
                                lastMessageId: id
                            };
                        }
                        return c;
                    });
                    
                    // Sort conversations to put the most recent on top
                    updatedConversations.sort((a, b) => b.lastTime - a.lastTime);
                    
                    // Update messages for this conversation
                    const conversationMessages = state.messages[receiverId] || [];
                    
                    return {
                        ...state,
                        conversations: updatedConversations,
                        messages: {
                            ...state.messages,
                            [receiverId]: [...conversationMessages, newMessage]
                        }
                    };
                } else {
                    // We shouldn't normally reach here as conversations should exist,
                    // but handle it gracefully just in case
                    const newConversation = {
                        id: receiverId,
                        name: "Unknown", // This should be updated elsewhere
                        avatar: "",
                        unreadCount: 0,
                        lastMessage: text,
                        lastTime: timestamp,
                        lastMessageId: id,
                        isOnline: false
                    };
                    
                    return {
                        ...state,
                        conversations: [newConversation, ...state.conversations],
                        messages: {
                            ...state.messages,
                            [receiverId]: [newMessage]
                        }
                    };
                }
            } else if (message.type === "message_read_confirmation") {
                // Handle message read confirmation
                const { conversationId, messageIds } = message.payload;
                
                if (!state.messages[conversationId]) return state;
                
                // Update status of the specified messages
                const updatedMessages = state.messages[conversationId].map(msg => {
                    if (messageIds.includes(msg.id)) {
                        return { ...msg, status: "read" };
                    }
                    return msg;
                });
                
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        [conversationId]: updatedMessages
                    }
                };
            } else if (message.type === "user_status_change") {
                // Handle user status change
                const { username, isOnline } = message.payload;
                
                // Update conversation online status
                const updatedConversations = state.conversations.map(c => {
                    if (c.name === username) {
                        return { ...c, isOnline };
                    }
                    return c;
                });
                
                return {
                    ...state,
                    conversations: updatedConversations
                };
            } else if (message.type === "message_request_response") {
                // Handle message request approval/rejection
                const { messageId, action, receiverUsername } = message.payload;
                console.log("WebSocket message_request_response received:", message.payload);
                
                // Update the message approval status in all conversations
                const updatedMessages = {};
                let affectedConversationId = null;
                
                // Loop through all conversations to find and update the message
                Object.keys(state.messages).forEach(convId => {
                    const messagesInConv = state.messages[convId];
                    const messageIndex = messagesInConv.findIndex(msg => msg.id === messageId);
                    
                    if (messageIndex > -1) {
                        // Found the message, update its approval status
                        const updatedMessagesInConv = [...messagesInConv];
                        updatedMessagesInConv[messageIndex] = {
                            ...updatedMessagesInConv[messageIndex],
                            approvalStatus: action,
                            approved: action === 'approve'
                        };
                        updatedMessages[convId] = updatedMessagesInConv;
                        affectedConversationId = convId;
                    } else {
                        // Message not found in this conversation, keep as is
                        updatedMessages[convId] = messagesInConv;
                    }
                });
                
                // Remove from pending requests if it's there
                const updatedPendingRequests = state.pendingRequests.filter(req => req.id !== messageId);
                
                // If the action is 'approve', update all pending messages in this conversation
                if (action === 'approve' && affectedConversationId) {
                    // Find the conversation in the conversations list
                    const conversationIndex = state.conversations.findIndex(c => c.id === affectedConversationId);
                    if (conversationIndex > -1) {
                        // Update the conversation to show it's now approved
                        const updatedConversations = [...state.conversations];
                        updatedConversations[conversationIndex] = {
                            ...updatedConversations[conversationIndex],
                            approved: true,
                            approvalStatus: 'approved'
                        };
                        
                        // Move this conversation to the top of the list
                        const updatedConversation = updatedConversations[conversationIndex];
                        updatedConversations.splice(conversationIndex, 1);
                        updatedConversations.unshift(updatedConversation);
                        
                        // Update all pending messages in this conversation to approved
                        if (updatedMessages[affectedConversationId]) {
                            updatedMessages[affectedConversationId] = updatedMessages[affectedConversationId].map(msg => {
                                if (msg.approvalStatus === 'pending') {
                                    return {
                                        ...msg,
                                        approvalStatus: 'approved',
                                        approved: true
                                    };
                                }
                                return msg;
                            });
                        }
                        
                        return {
                            ...state,
                            messages: updatedMessages,
                            conversations: updatedConversations,
                            pendingRequests: updatedPendingRequests
                        };
                    }
                } else if (action === 'reject') {
                    // If rejected, remove the conversation if it only had pending messages
                    if (affectedConversationId) {
                        const allMessagesInConvPending = updatedMessages[affectedConversationId].every(
                            msg => msg.approvalStatus === 'pending' || msg.approvalStatus === 'rejected'
                        );
                        
                        if (allMessagesInConvPending) {
                            // Remove the conversation if all messages were pending/rejected
                            const updatedConversations = state.conversations.filter(
                                c => c.id !== affectedConversationId
                            );
                            
                            // Remove the messages for this conversation
                            const newMessages = { ...updatedMessages };
                            delete newMessages[affectedConversationId];
                            
                            return {
                                ...state,
                                messages: newMessages,
                                conversations: updatedConversations,
                                pendingRequests: updatedPendingRequests,
                                // If this was the active conversation, clear it
                                activeConversation: state.activeConversation === affectedConversationId ? 
                                    null : state.activeConversation
                            };
                        }
                    }
                }
                
                return {
                    ...state,
                    messages: updatedMessages,
                    pendingRequests: updatedPendingRequests
                };
            } else if (message.type === "message_request_approved") {
                // Handle message request approved notification for the receiver
                const { messageId, senderId, senderUsername } = message.payload;
                
                // Refresh conversations to show the newly approved conversation
                // This is a simpler approach than trying to update the specific conversation
                return {
                    ...state,
                    // We'll let the component fetch conversations again
                };
            } else if (message.type === "new_pending_request") {
                // Handle new pending request notification
                const { id, senderId, senderName, text, timestamp } = message.payload;
                
                // Create a new pending request object
                const newRequest = {
                    id,
                    senderId,
                    senderName,
                    text,
                    timestamp
                };
                
                // Add to pending requests and update badge
                return {
                    ...state,
                    pendingRequests: [newRequest, ...state.pendingRequests]
                };
            } else {
                return state;
            }
            
        case messageConstants.SET_MESSAGES:
            // If action.payload is an array, it's a direct array of messages
            // If it's an object with a conversationId property, it's a message with a specified conversation
            if (Array.isArray(action.payload) && action.payload.length > 0) {
                // It's a direct array of messages for the active conversation
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        [state.activeConversation]: action.payload
                    }
                };
            } else if (action.payload && action.payload.conversationId) {
                // It's a message with a specified conversation
                const { conversationId, messages } = action.payload;
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        [conversationId]: messages
                    }
                };
            } else {
                // Default case - just use the active conversation
                return {
                    ...state,
                    messages: {
                        ...state.messages,
                        [state.activeConversation]: action.payload || []
                    }
                };
            }
            
        case messageConstants.ADD_MESSAGE:
            const conversationId = action.payload.conversationId || state.activeConversation;
            if (!conversationId) {
                console.error("No conversation ID for message:", action.payload);
                return state;
            }
            
            // Get existing messages for this conversation
            const conversationMessages = state.messages[conversationId] || [];
            
            // Check if message already exists to avoid duplicates
            const messageExists = conversationMessages.some(m => m.id === action.payload.id);
            if (messageExists) {
                return state;
            }
            
            // Create a clean message object without the conversationId property
            const { conversationId: _, ...cleanMessage } = action.payload;
            
            // Add the message to the conversation
            const updatedMessagesForAdd = {
                ...state.messages,
                [conversationId]: [...conversationMessages, cleanMessage]
            };
            
            // Update the conversation with the latest message info
            const updatedConversationsForAdd = state.conversations.map(conv => {
                if (conv.id === conversationId) {
                    return {
                        ...conv,
                        lastMessage: cleanMessage.text,
                        lastTime: cleanMessage.timestamp,
                        lastMessageId: cleanMessage.id
                    };
                }
                return conv;
            });
            
            // Sort conversations to put the most recent on top
            updatedConversationsForAdd.sort((a, b) => {
                const aTime = new Date(a.lastTime).getTime();
                const bTime = new Date(b.lastTime).getTime();
                return bTime - aTime;
            });
            
            return {
                ...state,
                messages: updatedMessagesForAdd,
                conversations: updatedConversationsForAdd
            };
            
        case messageConstants.SET_CONVERSATIONS:
            return {
                ...state,
                conversations: action.payload
            };
            
        case messageConstants.UPDATE_CONVERSATION:
            return {
                ...state,
                conversations: state.conversations.map(c => 
                    c.id === action.payload.id ? { ...c, ...action.payload } : c
                )
            };
            
        case messageConstants.SET_UNREAD_COUNT:
            return {
                ...state,
                totalUnreadCount: action.payload
            };
            
        case messageConstants.SET_ACTIVE_CONVERSATION:
            // Reset unread count for the active conversation
            const updatedConversations = state.conversations.map(c => {
                if (c.id === action.payload) {
                    return { ...c, unreadCount: 0 };
                }
                return c;
            });
            
            // Calculate new total unread count
            const newTotalUnread = updatedConversations.reduce(
                (total, conv) => total + (conv.unreadCount || 0), 0
            );
            
            return {
                ...state,
                activeConversation: action.payload,
                conversations: updatedConversations,
                totalUnreadCount: newTotalUnread
            };
            
        case messageConstants.UPDATE_MESSAGE_STATUS:
            if (!state.activeConversation) return state;
            
            const { messageId: statusMessageId, status } = action.payload;
            const activeMessages = state.messages[state.activeConversation] || [];
            
            return {
                ...state,
                messages: {
                    ...state.messages,
                    [state.activeConversation]: activeMessages.map(msg => 
                        msg.id === statusMessageId ? { ...msg, status } : msg
                    )
                }
            };
            
        case messageConstants.CLEAR_MESSAGES:
            return initialState;
            
        case messageConstants.SET_PENDING_REQUESTS:
            return {
                ...state,
                pendingRequests: action.payload
            };
            
        case messageConstants.ADD_PENDING_REQUEST:
            return {
                ...state,
                pendingRequests: [action.payload, ...state.pendingRequests]
            };
            
        case messageConstants.REMOVE_PENDING_REQUEST:
            return {
                ...state,
                pendingRequests: state.pendingRequests.filter(req => req.id !== action.payload)
            };
            
        case messageConstants.UPDATE_MESSAGE_APPROVAL:
            // Update approval status for a message in all conversations
            const { messageId, approvalStatus } = action.payload;
            const updatedMessagesForApproval = {};
            
            // Loop through all conversations to find and update the message
            Object.keys(state.messages).forEach(convId => {
                const messagesInConv = state.messages[convId];
                const messageIndex = messagesInConv.findIndex(msg => msg.id === messageId);
                
                if (messageIndex > -1) {
                    // Found the message, update its approval status
                    const updatedMessagesInConv = [...messagesInConv];
                    updatedMessagesInConv[messageIndex] = {
                        ...updatedMessagesInConv[messageIndex],
                        approvalStatus,
                        approved: approvalStatus === 'approved'
                    };
                    updatedMessagesForApproval[convId] = updatedMessagesInConv;
                } else {
                    // Message not found in this conversation, keep as is
                    updatedMessagesForApproval[convId] = messagesInConv;
                }
            });
            
            return {
                ...state,
                messages: updatedMessagesForApproval
            };
            
        default:
            return state;
    }
};
