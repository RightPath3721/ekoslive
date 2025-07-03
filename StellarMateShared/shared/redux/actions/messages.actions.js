import { messageConstants } from "../constants/messages.constants";

export const messageAction = {
    setMessages,
    addMessage,
    setConversations,
    updateConversation,
    setUnreadCount,
    setActiveConversation,
    updateMessageStatus,
    clearMessages,
    setPendingRequests,
    addPendingRequest,
    removePendingRequest,
    updateMessageApproval
};

function setMessages(messages) {
    return {
        type: messageConstants.SET_MESSAGES,
        payload: messages
    }
}

function addMessage(message) {
    return {
        type: messageConstants.ADD_MESSAGE,
        payload: message
    }
}

function setConversations(conversations) {
    return {
        type: messageConstants.SET_CONVERSATIONS,
        payload: conversations
    }
}

function updateConversation(conversation) {
    return {
        type: messageConstants.UPDATE_CONVERSATION,
        payload: conversation
    }
}

function setUnreadCount(count) {
    return {
        type: messageConstants.SET_UNREAD_COUNT,
        payload: count
    }
}

function setActiveConversation(conversationId) {
    return {
        type: messageConstants.SET_ACTIVE_CONVERSATION,
        payload: conversationId
    }
}

function updateMessageStatus(messageId, status) {
    return {
        type: messageConstants.UPDATE_MESSAGE_STATUS,
        payload: { messageId, status }
    }
}

function clearMessages() {
    return {
        type: messageConstants.CLEAR_MESSAGES
    }
}

function setPendingRequests(requests) {
    return {
        type: messageConstants.SET_PENDING_REQUESTS,
        payload: requests
    }
}

function addPendingRequest(request) {
    return {
        type: messageConstants.ADD_PENDING_REQUEST,
        payload: request
    }
}

function removePendingRequest(requestId) {
    return {
        type: messageConstants.REMOVE_PENDING_REQUEST,
        payload: requestId
    }
}

function updateMessageApproval(messageId, approvalStatus) {
    return {
        type: messageConstants.UPDATE_MESSAGE_APPROVAL,
        payload: { messageId, approvalStatus }
    }
}
