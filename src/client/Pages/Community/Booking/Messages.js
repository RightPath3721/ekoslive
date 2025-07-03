import React, { useState, useEffect, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  IconButton, 
  Avatar, 
  Divider, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText,
  Badge,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
  ClickAwayListener,
  Popper
} from "@mui/material";
import EmojiPicker from 'emoji-picker-react';
import SendIcon from "@mui/icons-material/Send";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import NotificationsIcon from "@mui/icons-material/Notifications";
import useActiveUser from "@hooks/useActiveUser";
import axios from "axios";
import { alpha } from "@mui/material/styles";
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { messageAction } from "@redux/actions/messages.actions";
import useProfile from "@hooks/community/useProfile";
import { useTheme } from "@mui/system";

// Dark theme color palette
const darkThemeColors = {
  background: {
    default: '#121212',
    paper: '#1E1E1E', 
    lighter: '#2D2D2D',
    darker: '#0A0A0A'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#B0B0B0',
    disabled: '#6E6E6E'
  },
  primary: {
    main: '#FF6600', // Orange primary color
    dark: '#D45500',
    light: '#FF8533',
    contrastText: '#FFFFFF'
  },
  divider: 'rgba(255, 255, 255, 0.12)',
  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 102, 0, 0.16)'
  }
};

const Messages = () => {
  const { palette } = useTheme();
  const user = useActiveUser();
  const { getCurrentUserProfile } = useProfile();
  const [userProfile, setUserProfile] = useState(null);
  const dispatch = useDispatch();

  // Redux state
  const { 
    conversations, 
    messages: allMessages, // Rename to avoid conflict with local variable
    activeConversation,
    pendingRequests, // Get pendingRequests from Redux store
    // totalUnreadCount // Can be used if needed later
  } = useSelector(state => state.messages);

  // Local component state
  const [loadingMessages, setLoadingMessages] = useState(false); // Renamed from 'loading'
  const [loadingConversations, setLoadingConversations] = useState(true); // Renamed from 'loadingContacts'
  const [searchResults, setSearchResults] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
  const [isWaitingForFirstApproval, setIsWaitingForFirstApproval] = useState(false); // State for first message approval

  // Refs for input focus
  const messageInputRef = useRef(null);
  
  // Message approval system state
  const [loadingPendingRequests, setLoadingPendingRequests] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [showPendingBadge, setShowPendingBadge] = useState(false);

  // Derive selected contact and current messages from Redux state
  const selectedContact = useMemo(() => 
    conversations.find(c => c.id === activeConversation), 
    [conversations, activeConversation]
  );
  
  const currentMessages = useMemo(() => 
    allMessages[activeConversation] || [], 
    [allMessages, activeConversation]
  );

  // Add new state for the approval modal
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingApprovalMessage, setPendingApprovalMessage] = useState(null);

  // Add a new state for notifications
  const [notification, setNotification] = useState(null);
  const [notificationType, setNotificationType] = useState("info"); // Can be "success", "error", "info", "warning"

  // Fetch the user profile data
  const fetchProfile = async () => {
    if (user) {
      try {
        const profile = await getCurrentUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    }
  };

  // Fetch pending message requests
  const fetchPendingRequests = async () => {
    if (!user?.username) return;
    
    try {
      setLoadingPendingRequests(true);
      const response = await axios.get(`/api/messages/requests/pending?username=${user.username}&token=${user.token}`);
      
      if (Array.isArray(response.data)) {
        // Update Redux store with pending requests
        dispatch(messageAction.setPendingRequests(response.data));
        setShowPendingBadge(response.data.length > 0);
      } else {
        console.warn("Unexpected response format for pending requests:", response.data);
        dispatch(messageAction.setPendingRequests([]));
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
      setError("Failed to load pending message requests.");
      dispatch(messageAction.setPendingRequests([]));
    } finally {
      setLoadingPendingRequests(false);
    }
  };
  
  // Handle approving or rejecting a message request
  const handleRequestResponse = async (messageId, action) => {
    if (!user?.username || !messageId || !action) return;
    
    try {
      setProcessingRequest(true);
      
      await axios.post(`/api/messages/requests/respond?username=${user.username}&token=${user.token}`, {
        messageId,
        action // 'approve' or 'reject'
      });
      
      // Remove the request from the Redux store
      dispatch(messageAction.removePendingRequest(messageId));
      
      // Close the dialog
      setRequestDialogOpen(false);
      setSelectedRequest(null);
      
      // Show success message
      setError(action === 'approve' ? 
        "Message request approved. You can now chat with this user." : 
        "Message request rejected."
      );
      
      // Refresh conversations if approved
      if (action === 'approve') {
        fetchConversations();
      }
      
      // Update the unread count to ensure badge is updated
      const updateUnreadCount = async () => {
        try {
          const countResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
          if (countResponse.data && typeof countResponse.data.messages === 'number') {
            dispatch(messageAction.setTotalUnreadCount(countResponse.data.messages));
          }
        } catch (err) {
          console.error("Error updating unread count after request response:", err);
        }
      };
      
      updateUnreadCount();
      
    } catch (err) {
      console.error(`Error ${action}ing message request:`, err);
      setError(`Failed to ${action} message request. Please try again.`);
    } finally {
      setProcessingRequest(false);
    }
  };
  
  // Open request dialog
  const openRequestDialog = (request) => {
    setSelectedRequest(request);
    setRequestDialogOpen(true);
  };

  useEffect(() => {
    fetchProfile();
    
    // Fetch pending requests when component mounts
    if (user?.username) {
      fetchPendingRequests();
    }
    
    // Set up polling for pending requests as a fallback
    // WebSocket notifications will update in real-time for new requests
    const intervalId = setInterval(() => {
      if (user?.username) {
        fetchPendingRequests();
      }
    }, 300000); // Check every 5 minutes as a fallback
    
    return () => clearInterval(intervalId);
  }, [user, getCurrentUserProfile]);
  
  // Update badge visibility when pendingRequests changes
  useEffect(() => {
    setShowPendingBadge(pendingRequests?.length > 0);
  }, [pendingRequests]);

  // Determine if waiting for the first message approval
  useEffect(() => {
    if (selectedContact && currentMessages && currentMessages.length > 0 && user) {
        // Find the very first message *sent by the current user* in this conversation
        const firstMessageSentByMe = currentMessages.find(msg => msg.senderId === 'self' || msg.senderId === user?.id);

        if (firstMessageSentByMe) {
            // Only show waiting state if this is the very first message in the conversation
            const isFirstMessageInConversation = currentMessages[0]?.id === firstMessageSentByMe.id;
            
            if (isFirstMessageInConversation) {
                // Check if the first message is not approved
                const firstMessageIsNotApproved = !(firstMessageSentByMe.approvalStatus === 'approved' || firstMessageSentByMe.approved === true);
                
                // We are waiting ONLY if this is the first message AND it's not approved
                setIsWaitingForFirstApproval(firstMessageIsNotApproved);
                
                // If message was just approved, update Redux state
                if (!firstMessageIsNotApproved && isWaitingForFirstApproval) {
                  dispatch(messageAction.updateMessageApproval({
                    messageId: firstMessageSentByMe.id,
                    approvalStatus: 'approved',
                    approved: true
                  }));
                  fetchMessages(activeConversation);
                }
            } else {
                // Not the first message - disable waiting state
                setIsWaitingForFirstApproval(false);
            }
        } else {
            // No message sent by me yet
            setIsWaitingForFirstApproval(false);
        }

    } else {
        // No selected contact or no messages yet
        setIsWaitingForFirstApproval(false);
    }
  }, [currentMessages, selectedContact, user, isWaitingForFirstApproval, activeConversation]); // Dependencies: messages, selected contact, and user info

  // Format timestamp for display in the contacts list
  const formatTimestamp = (timestamp) => {
    // Add robust check for valid timestamp before creating Date object
    if (!timestamp || typeof timestamp !== 'string' && typeof timestamp !== 'number') {
        return ''; // Return empty if timestamp is missing or not a string/number
    }

    try {
        const date = new Date(timestamp);
        // Check if the date object is valid
        if (isNaN(date.getTime())) {
            console.warn("Invalid date value received in formatTimestamp:", timestamp);
            return ''; // Return empty for invalid dates
        }

        if (isToday(date)) {
            return format(date, 'h:mm a'); // Today: '3:30 PM'
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            // Check if it's within the current week
            const now = new Date();
            const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffInDays < 7) {
                return format(date, 'EEEE'); // Day of week: 'Monday'
            } else if (now.getFullYear() === date.getFullYear()) {
                return format(date, 'MMM d'); // Same year: 'Jan 5'
            } else {
                return format(date, 'MM/dd/yyyy'); // Different year: '01/05/2022'
            }
        }
    } catch (error) {
        // Catch potential errors during date processing
        console.error("Error formatting timestamp:", timestamp, error);
        return ''; // Return empty on error
    }
  };

  // Format timestamp for display within the chat messages
  const formatMessageTimestamp = (timestamp) => {
    if (!timestamp) return '';

    // Check if it might already be formatted (e.g., "10:42 AM")
    // This is a basic check; more robust parsing could be added if needed.
    if (typeof timestamp === 'string' && /^\d{1,2}:\d{2}\s(AM|PM)$/i.test(timestamp.trim())) {
      return timestamp.trim(); // Return the pre-formatted string
    }

    // Proceed with formatting if it's likely a valid timestamp (number or parsable string)
    if (typeof timestamp !== 'string' && typeof timestamp !== 'number') {
        return ''; 
    }

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            // If it's a string but couldn't be parsed as a date, return it as is.
            if (typeof timestamp === 'string') {
                 console.warn("Returning original string timestamp as it couldn't be parsed:", timestamp);
                 return timestamp;
            }
            console.warn("Invalid date value received in formatMessageTimestamp:", timestamp);
            return '';
        }
        
        // Format based on whether it's today or not
        if (isToday(date)) {
            return format(date, 'p'); // 'h:mm a'
        } else {
            return format(date, 'MMM d, p'); // 'Jan 5, 3:30 PM'
        }
    } catch (error) {
        console.error("Error formatting message timestamp:", timestamp, error);
        return '';
    }
  };

  // Get contacts from conversations or search results
  const filteredContacts = useMemo(() => {
    const list = searchTerm.trim() ? searchResults : conversations;
    return Array.isArray(list) ? list.filter(contact => contact !== null) : [];
  }, [searchTerm, searchResults, conversations]);

  // Search users by username or email
  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      const response = await axios.get(`/api/messages/search?query=${query}&username=${user.username}&token=${user.token}`);
      
      console.log("Search results:", response.data);
      
      // Map users to the same format as conversations for consistent rendering
      const mappedUsers = Array.isArray(response.data) ? response.data.map(u => {
        // Ensure we have a valid ID for the user
        const userId = u.socialAccount || u._id;
        
        if (!userId) {
          console.warn("User without ID found in search results:", u);
          return null;
        }
        
        return {
          id: userId,
          name: u.username,
          username: u.username, // Keep the original username for API calls
          avatar: u.avatar || "/public/profile_default_image.webp",
          unreadCount: 0, // Search results don't have unread counts initially
          lastMessage: '', // No last message for search results
          lastTime: u.lastLogged || new Date().toISOString(), // Use last logged time if available
          isOnline: Boolean(u.connected), 
          email: u.email || '',
          // Keep original data for reference
          _id: u._id,
          socialAccount: u.socialAccount
        };
      }).filter(u => u !== null) : [];
      
      console.log("Mapped search results:", mappedUsers);
      setSearchResults(mappedUsers); // Keep search results local
    } catch (err) {
      console.error("Error searching users:", err);
      setError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch all conversations for the user
  const fetchConversations = async () => {
    if (!user?.username) return;
    
    try {
      setLoadingConversations(true);
      const response = await axios.get(`/api/messages/conversations?username=${user.username}&token=${user.token}`);
      
      if (Array.isArray(response.data)) {
        // Dispatch action to update conversations in Redux store
        // Ensure data matches the expected format AND normalize the name
        const formattedConversations = response.data.map(c => ({
          id: c.id || '',
          // Normalize name here: trim and lowercase before storing in Redux
          name: c.name?.trim().toLowerCase() || 'unknown user', 
          avatar: c.avatar || "/public/profile_default_image.webp",
          unreadCount: c.unreadCount || 0,
          lastMessage: c.lastMessage || '',
          lastTime: c.lastTime || new Date().toISOString(),
          lastMessageId: c.lastMessageId || null, // Add lastMessageId if available
          isOnline: Boolean(c?.isOnline)
        })).filter(c => c.id); // Filter out any invalid entries

        // Sort by lastTime descending
        formattedConversations.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

        dispatch(messageAction.setConversations(formattedConversations));
      } else {
        console.warn("Unexpected response format for conversations:", response.data);
        dispatch(messageAction.setConversations([])); // Set empty array in Redux
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Failed to load your conversations. Please try again.");
      dispatch(messageAction.setConversations([])); // Set empty array on error
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for the active conversation
  const fetchMessages = async (conversationId) => {
    if (!user?.username || !conversationId) return;
    
    try {
      setLoadingMessages(true);
      // Ensure active conversation is set before fetching
      if (activeConversation !== conversationId) {
         // This dispatch also handles marking messages as read in the reducer
        dispatch(messageAction.setActiveConversation(conversationId));
      }
      
      const response = await axios.get(`/api/messages/messages/${conversationId}?username=${user.username}&token=${user.token}`);
      
      // Check if response has the expected structure
      if (response.data && (Array.isArray(response.data.messages) || Array.isArray(response.data))) {
        // Handle both formats: { messages: [...] } or directly [...]
        const messagesArray = response.data.messages || response.data;
        
        // Regex for booking approval message
        const bookingApprovalRegex = /^Your booking request for ".*" has been approved\..*Reference: \w+/i;

        // Dispatch action to set messages for the active conversation
        // Filter out rejected messages
        const formattedMessages = messagesArray
          .filter(m => m.approvalStatus !== 'rejected') // Filter out rejected messages
          .map(m => {
          const messageText = m.text || '';
          const isBookingApproval = bookingApprovalRegex.test(messageText.trim());
          
          return {
            id: m.id || '',
            senderId: m.senderId || (m.senderUsername === user.username ? 'self' : ''), // Map senderId correctly
            receiverId: m.receiverId || (m.receiverUsername === user.username ? 'self' : ''), // Map receiverId if needed
            text: messageText,
            timestamp: m.timestamp || new Date().toISOString(),
            status: m.status || 'received', // Add status if available
            // Set approval status based on pattern match or API data
            approvalStatus: isBookingApproval ? 'approved' : (m.approvalStatus || 'approved'), // Default to approved if not booking approval and no status provided
            approved: isBookingApproval ? true : (m.approved !== undefined ? m.approved : true) // Default to true if not booking approval and no flag provided
          };
        }).filter(m => m.id);
        
        dispatch(messageAction.setMessages(formattedMessages));
        
        // Check if there are pending messages that need approval
        if (response.data.hasPendingMessages) {
          setError("This conversation has pending messages that need approval.");
        }
        
        // Update the unread count after messages are loaded and marked as read
        // This ensures the badge count is updated when messages are read
        const updateUnreadCount = async () => {
          try {
            const countResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
            if (countResponse.data && typeof countResponse.data.messages === 'number') {
              dispatch(messageAction.setTotalUnreadCount(countResponse.data.messages));
            }
          } catch (err) {
            console.error("Error updating unread count:", err);
          }
        };
        
        updateUnreadCount();
      } else {
        console.warn("Unexpected response format:", response.data);
        dispatch(messageAction.setMessages([]));
      }
      
      // Note: Marking messages as read is handled by setActiveConversation in the reducer
      
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
      dispatch(messageAction.setMessages([])); // Clear messages on error
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle search term changes with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Load conversations when component mounts
  useEffect(() => {
    if (user?.username) {
      fetchConversations();
    }
  }, [user?.username, dispatch]); // Add dispatch dependency

  // WebSocket handling is now done in the reducer via WEBSOCKET_MESSAGE action
  // Remove the useEffect for window.addEventListener('message', handleWebSocketMessage);

  // Load messages when the active conversation changes
  useEffect(() => {
    if (activeConversation) {
      // Fetch messages only if they aren't already loaded for this conversation
      // (or if we want to refresh them every time)
      // For simplicity, fetch every time activeConversation changes
      fetchMessages(activeConversation);
      
      // When a conversation is selected, update the unread count in the parent component
      // This will help update the badge count in the Messages tab
      const fetchUnreadCount = async () => {
        try {
          const response = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
          if (response.data && typeof response.data.messages === 'number') {
            // Update the total unread count in Redux
            dispatch(messageAction.setTotalUnreadCount(response.data.messages));
          }
        } catch (err) {
          console.error("Error fetching updated unread count:", err);
        }
      };
      
      // Fetch the updated unread count immediately to update the badge
      fetchUnreadCount();
    } else {
      // Clear messages if no conversation is active
      dispatch(messageAction.setMessages([])); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, dispatch]); // Add dispatch dependency
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]); // Depend on currentMessages derived from Redux
  
  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    // Focus back on the input after selecting an emoji
    messageInputRef.current?.focus();
  };
  
  // Toggle emoji picker
  const handleEmojiButtonClick = (event) => {
    setEmojiAnchorEl(event.currentTarget);
    setShowEmojiPicker(prev => !prev);
  };
  
  // Close emoji picker
  const handleCloseEmojiPicker = () => {
    setShowEmojiPicker(false);
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || !user?.username) {
      console.error("Cannot send message: missing required data", { 
        hasMessage: Boolean(newMessage.trim()), 
        hasSelectedContact: Boolean(selectedContact),
        hasUsername: Boolean(user?.username)
      });
      // Add check for waiting for first approval
      if (isWaitingForFirstApproval) {
        console.error("Cannot send message: Waiting for first message approval.");
        setError("Please wait for the recipient to approve your first message.");
        return;
      }
      return; // Return if basic checks fail
    }

    // Removed the broader check for any pending message, relying on isWaitingForFirstApproval for the specific case.
    // const hasApprovedMessages = currentMessages.some(msg => msg.approved);
    // const isPendingApproval = currentMessages.some(msg => msg.approvalStatus === 'pending');
    // if (isPendingApproval && !hasApprovedMessages) {
    //   setError("This conversation is pending approval. You'll be able to send more messages once the recipient approves your request.");
    //   return;
    // }
    
    try {
      setIsSending(true);
      
      // Store the message content before clearing the input
      const messageContent = newMessage;
      
      // Clear the input field immediately (optimistic)
      setNewMessage("");
      
      // Close emoji picker if open
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
      }
      
      // Log the selected contact for debugging
      console.log("Selected contact for sending message:", selectedContact);
      
      // For new contacts, use the username property instead of name
      const receiverUsername = selectedContact.isNewContact ? 
        selectedContact.username : selectedContact.name;
      
      console.log("Sending message to:", receiverUsername);
      
      // Send the message via API first
      const response = await axios.post(`/api/messages/send?username=${user.username}&token=${user.token}`, {
        receiverUsername: receiverUsername,
        content: messageContent
      });
      
      console.log("Message send response:", response.data);
      
      if (response.data && response.data.id) {
        // Check if the message is a booking approval message
        const bookingApprovalRegex = /^Your booking request for ".*" has been approved\..*Reference: \w+/i;
        const isBookingApproval = bookingApprovalRegex.test(messageContent.trim());

        // Create a message object with the response data
        const newMessage = {
          id: response.data.id,
          senderId: 'self',
          receiverId: selectedContact.id,
          text: messageContent,
          timestamp: response.data.timestamp || new Date().toLocaleString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          status: 'sent',
          // Set approval status based on pattern match or API response
          approvalStatus: isBookingApproval ? 'approved' : (response.data.approvalStatus || 'pending'),
          approved: isBookingApproval ? true : (response.data.approved || false)
        };
        
        // Add the message to the current conversation
        const currentMessages = allMessages[selectedContact.id] || [];
        const updatedMessages = [...currentMessages, newMessage];
        
        // Update Redux state
        dispatch(messageAction.setMessages(updatedMessages));
        
        // Update the conversation with the latest message
        dispatch(messageAction.updateConversation({
          id: selectedContact.id,
          lastMessage: messageContent,
          lastTime: new Date().toISOString(),
          lastMessageId: response.data.id
        }));
        
        // Update the unread count to ensure badge is updated
        const updateUnreadCount = async () => {
          try {
            const countResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
            if (countResponse.data && typeof countResponse.data.messages === 'number') {
              dispatch(messageAction.setTotalUnreadCount(countResponse.data.messages));
            }
          } catch (err) {
            console.error("Error updating unread count after sending message:", err);
          }
        };
        
        updateUnreadCount();
        
        // Ensure the conversation is at the top of the list
        const updatedConversations = [
          selectedContact,
          ...conversations.filter(c => c.id !== selectedContact.id)
        ];
        dispatch(messageAction.setConversations(updatedConversations));
        
        // Scroll to the bottom to show the new message
        setTimeout(scrollToBottom, 100);
        
        // Focus back on the input field after sending a message
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      }
      
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      // Revert optimistic updates
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };
  // Handle selecting a conversation
  const handleContactSelect = (contact) => {
    if (!contact || !contact.id) {
      console.error("Invalid contact selected:", contact);
      setError("Invalid contact selected. Please try again.");
      return;
    }
    
    console.log("Selected contact:", contact);
    
    // Check if this is a new contact from search results
    const isNewContact = searchTerm && searchResults.some(r => r.id === contact.id);
    
    if (isNewContact) {
      console.log("New contact from search results");
      
      // Create a temporary conversation object
      const tempConversation = {
        id: contact.id, // Use the id directly
        name: contact.name || contact.username || "Unknown User",
        username: contact.username, // Keep the original username for API calls
        avatar: contact.avatar || "/public/profile_default_image.webp",
        unreadCount: 0,
        lastMessage: '',
        lastTime: new Date().toISOString(),
        isOnline: Boolean(contact.connected || contact.isOnline),
        isNewContact: true // Flag to indicate this is a new contact
      };
            
      // First add the conversation to the conversations list
      const updatedConversations = [tempConversation, ...conversations];
      dispatch(messageAction.setConversations(updatedConversations));
      
      // Then set as active conversation
      setTimeout(() => {
        dispatch(messageAction.setActiveConversation(tempConversation.id));
        
        // Show a welcome message for new contacts
        setError(`This is a new conversation with ${tempConversation.name}. Type a message and click send to start chatting.`);
      }, 100); // Small delay to ensure the conversation is added first
    } else {
      console.log("Existing contact selected");
      // For existing conversations, just set as active
      dispatch(messageAction.setActiveConversation(contact.id));
    }
    
    // Clear search term when a conversation is selected from search results
    if (searchTerm) {
      setSearchTerm("");
      setSearchResults([]); // Clear local search results
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Polling mechanism to update user status periodically
  useEffect(() => {
    const updateOnlineStatus = async () => {
      // Use conversations from Redux store
      if (!user?.username || conversations.length === 0) return;
      
      try {
        const response = await axios.get(`/api/messages/status?username=${user.username}&token=${user.token}`);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          const statusMap = response.data.reduce((map, statusInfo) => {
            map[statusInfo.username] = statusInfo.isOnline;
            return map;
          }, {});
          
          // Dispatch actions to update conversation status in Redux
          conversations.forEach(conv => {
            const serverStatus = statusMap[conv.name];
            if (serverStatus !== undefined && Boolean(conv.isOnline) !== Boolean(serverStatus)) {
              dispatch(messageAction.updateConversation({ id: conv.id, isOnline: Boolean(serverStatus) }));
            }
          });
        }
      } catch (err) {
        console.error("Error polling online status:", err);
      }
    };
    
    updateOnlineStatus(); // Initial fetch
    const intervalId = setInterval(updateOnlineStatus, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [user?.username, conversations, dispatch]); // Add conversations and dispatch dependencies

  // Render online status indicator (no changes needed here)
  const renderOnlineStatus = (isOnline) => {
    return (
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: isOnline ? '#4caf50' : '#bdbdbd', // Brighter green for online
          position: 'absolute',
          bottom: 3,
          right: 3,
          border: `2px solid ${darkThemeColors.background.paper}`,
          // Add a subtle pulse animation when online
          ...(isOnline ? {
            '&::after': {
              content: '""',
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              opacity: 0.4,
              animation: 'pulse 2s infinite'
            },
            '@keyframes pulse': {
              '0%': {
                transform: 'scale(1)',
                opacity: 0.7
              },
              '70%': {
                transform: 'scale(1.5)',
                opacity: 0
              },
              '100%': {
                transform: 'scale(1)',
                opacity: 0
              }
            }
          } : {})
        }}
      />
    );
  };

  // Check for messages needing approval when messages change
  useEffect(() => {
    if (currentMessages && currentMessages.length > 0 && user) {
      // Find the first message in the conversation that needs approval
      const firstPendingMessage = currentMessages.find(msg => 
        msg.senderId !== 'self' && 
        msg.senderId !== user?.id && 
        msg.approvalStatus === 'pending'
      );
      
      if (firstPendingMessage) {
        setPendingApprovalMessage(firstPendingMessage);
        setApprovalModalOpen(true);
      } else {
        setPendingApprovalMessage(null);
      }
    }
  }, [currentMessages, user]);

  // Handle approving or rejecting a message directly from the modal
  const handleMessageApproval = async (action) => {
    if (!user?.username || !pendingApprovalMessage?.id) return;
    
    try {
      setProcessingRequest(true);
      
      await axios.post(`/api/messages/requests/respond?username=${user.username}&token=${user.token}`, {
        messageId: pendingApprovalMessage.id,
        action // 'approve' or 'reject'
      });
      
      if (action === 'approve') {
        // Update the message in the current conversation
        dispatch(messageAction.updateMessageApproval({
          messageId: pendingApprovalMessage.id,
          approvalStatus: 'approved'
        }));
        
        // Show success message with proper notification
        setNotification("Message request approved. You can now chat with this user.");
        setNotificationType("success");
        
        // Refresh conversations and messages
        fetchConversations();
        fetchMessages(activeConversation);
      } else {
        // For rejection, we'll use the existing actions to handle this
        
        // 1. First, update the message approval status to 'rejected'
        dispatch(messageAction.updateMessageApproval({
          messageId: pendingApprovalMessage.id,
          approvalStatus: 'rejected'
        }));
        
        // 2. Remove the conversation from the list
        if (activeConversation) {
          // Filter out this conversation from the conversations list
          const updatedConversations = conversations.filter(conv => conv.id !== activeConversation);
          dispatch(messageAction.setConversations(updatedConversations));
          
          // 3. Clear the active conversation
          dispatch(messageAction.setActiveConversation(null));
          
          // 4. Clear the messages for this conversation
          // Note: The clearMessages action doesn't take parameters in your implementation,
          // so we'll need to handle this differently
          
          // Create a new messages object without the rejected conversation
          const updatedMessages = { ...allMessages };
          delete updatedMessages[activeConversation];
          
          // Set the updated messages
          dispatch(messageAction.setMessages({ 
            conversationId: null,
            messages: []
          }));
          
          // Show rejection message with proper notification
          setNotification("Message request rejected. The conversation has been removed.");
          setNotificationType("info");
        }
      }
      
      // Close the modal by clearing the pending message
      setPendingApprovalMessage(null);
      
      // Remove from pending requests if it exists there
      dispatch(messageAction.removePendingRequest(pendingApprovalMessage.id));
      
      // Update the unread count
      const updateUnreadCount = async () => {
        try {
          const countResponse = await axios.get(`/api/messages/pending?username=${user.username}&token=${user.token}`);
          if (countResponse.data && typeof countResponse.data.messages === 'number') {
            dispatch(messageAction.setUnreadCount(countResponse.data.messages));
          }
        } catch (err) {
          console.error("Error updating unread count after approval:", err);
        }
      };
      
      updateUnreadCount();
      
    } catch (err) {
      console.error(`Error ${action}ing message:`, err);
      setError(`Failed to ${action} message. Please try again.`);
    } finally {
      setProcessingRequest(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 180px)', 
      bgcolor: darkThemeColors.background.default,
      borderRadius: 1,
      overflow: 'hidden',
      border: `1px solid ${darkThemeColors.divider}`
    }}>
      {/* Contact list sidebar */}
      <Paper 
        elevation={0} 
        sx={{ 
          width: 260, 
          borderRight: 1, 
          borderColor: darkThemeColors.divider,
          bgcolor: darkThemeColors.background.paper,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: darkThemeColors.divider }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ color: darkThemeColors.text.primary }}>
              Messages
            </Typography>
            
            {/* Remove notification badge icon */}
          </Box>
          
          <TextField
            size="small"
            placeholder="Search users..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: darkThemeColors.text.secondary }} />
                </InputAdornment>
              ),
              endAdornment: isSearching ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} sx={{ color: darkThemeColors.text.secondary }} />
                </InputAdornment>
              ) : null
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: alpha(darkThemeColors.text.primary, 0.2),
                },
                '&:hover fieldset': {
                  borderColor: alpha(darkThemeColors.text.primary, 0.3),
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkThemeColors.primary.main,
                },
                '& input': {
                  color: darkThemeColors.text.primary,
                },
              },
              '& .MuiInputLabel-root': {
                color: darkThemeColors.text.secondary,
              },
            }}
          />
        </Box>
        
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {/* Use loadingConversations state */}
          {loadingConversations && !searchTerm ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={28} sx={{ color: darkThemeColors.primary.main }} />
            </Box>
          ) : filteredContacts.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ color: darkThemeColors.text.secondary }}
              >
                {searchTerm ? "No users found" : "No conversations yet"}
              </Typography>
            </Box>
          ) : (
            filteredContacts.map(contact => {
              // Skip rendering if contact is null or missing crucial properties
              if (!contact || !contact.id || !contact.name) return null;
              
              return (
                <ListItem 
                  key={contact.id}
                  button
                  alignItems="flex-start"
                  // Use activeConversation for selection
                  selected={activeConversation === contact.id} 
                  onClick={() => handleContactSelect(contact)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: darkThemeColors.divider,
                    '&.Mui-selected': {
                      bgcolor: darkThemeColors.action.selected,
                      '&:hover': {
                        bgcolor: alpha(darkThemeColors.primary.main, 0.25),
                      }
                    },
                    '&:hover': {
                      bgcolor: darkThemeColors.action.hover,
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      badgeContent={contact.unreadCount > 0 ? contact.unreadCount : null}
                      color="primary"
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: darkThemeColors.primary.main,
                          color: darkThemeColors.text.primary
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Avatar 
                          alt={contact.name}
                          src={contact.avatar || "/public/profile_default_image.webp"}
                          sx={{ 
                            bgcolor: contact.unreadCount > 0 ? 
                              alpha(darkThemeColors.primary.main, 0.8) : 
                              darkThemeColors.background.lighter 
                          }}
                        >
                          {contact.name?.charAt(0) || '?'} {/* Add safety check */}
                        </Avatar>
                        {renderOnlineStatus(Boolean(contact?.isOnline))}
                      </Box>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            color: darkThemeColors.text.primary,
                            fontWeight: contact.unreadCount > 0 ? 600 : 400
                          }}
                        >
                              {contact.name || 'Unknown User'} {/* Add safety check */}
                            </Typography>
                            {contact.lastTime && (
                              <Typography
                            variant="caption" 
                            sx={{ 
                              color: contact.unreadCount > 0 ? 
                                darkThemeColors.primary.light : 
                                darkThemeColors.text.secondary
                            }}
                          >
                            {formatTimestamp(contact.lastTime)}
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            display: 'inline',
                            maxWidth: '140px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: contact.unreadCount > 0 ?
                              darkThemeColors.text.primary :
                              darkThemeColors.text.secondary
                          }}
                        >
                          {/* Handle display logic based on context */}
                          {searchTerm 
                            ? contact.email || 'No email' 
                            : contact.lastMessage || "Start a conversation"}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })
          )}
        </List>
      </Paper>
      
      {/* Chat area */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flexGrow: 1, 
        bgcolor: darkThemeColors.background.default,
        position: 'relative' // Add position relative for absolute positioning of the approval overlay
      }}>
        {selectedContact ? (
          <>
            {/* Chat header - Use selectedContact derived from Redux */}
            <Box 
              sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center', 
                borderBottom: 1, 
                borderColor: darkThemeColors.divider,
                bgcolor: darkThemeColors.background.paper
              }}
            >
              <Box sx={{ position: 'relative', mr: 2 }}>
                <Avatar 
                  alt={selectedContact.name || 'User'}
                  src={selectedContact.avatar || "/public/profile_default_image.webp"}
                  sx={{ 
                    bgcolor: alpha(darkThemeColors.primary.main, 0.7)
                  }}
                >
                  {selectedContact.name?.charAt(0) || '?'} {/* Safety check */}
                </Avatar>
                {renderOnlineStatus(selectedContact.isOnline)}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" sx={{ color: darkThemeColors.text.primary }}>
                  {selectedContact.name || 'Unknown User'} {/* Safety check */}
                </Typography>
                <Typography variant="caption" sx={{ color: darkThemeColors.text.secondary }}>
                  {selectedContact.isOnline ? 'Online' : 'Offline'} {/* Status from Redux */}
                </Typography>
              </Box>
              <Tooltip title="More options">
                <IconButton sx={{ color: darkThemeColors.text.secondary }}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Messages area */}
            <Box 
              sx={{ 
                p: 2, 
                flexGrow: 1, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: alpha(darkThemeColors.background.darker, 0.4),
                position: 'relative'
              }}
            >
              {/* Approval overlay - integrated into the chat UI */}
              {pendingApprovalMessage && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    bgcolor: alpha(darkThemeColors.background.default, 0.85),
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <Paper
                    elevation={4}
                    sx={{
                      p: 3,
                      maxWidth: 500,
                      width: '90%',
                      bgcolor: darkThemeColors.background.paper,
                      borderRadius: 2,
                      border: `1px solid ${alpha(darkThemeColors.primary.main, 0.3)}`
                    }}
                  >
                    <Typography variant="h6" sx={{ 
                      color: darkThemeColors.text.primary, 
                      mb: 2,
                      textAlign: 'center'
                    }}>
                      New Message Request
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        alt={selectedContact?.name || 'User'}
                        src={selectedContact?.avatar || "/public/profile_default_image.webp"}
                        sx={{ 
                          mr: 2,
                          width: 48,
                          height: 48,
                          bgcolor: alpha(darkThemeColors.primary.main, 0.7)
                        }}
                      >
                        {selectedContact?.name?.charAt(0) || '?'}
                      </Avatar>
                      
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: darkThemeColors.text.primary }}>
                          {selectedContact?.name || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkThemeColors.text.secondary }}>
                          {formatMessageTimestamp(pendingApprovalMessage.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Paper
                      elevation={0}
                      sx={{ 
                        p: 2,
                        mb: 3,
                        bgcolor: darkThemeColors.background.lighter,
                        borderRadius: 2,
                        border: `1px solid ${alpha(darkThemeColors.text.primary, 0.1)}`
                      }}
                    >
                      <Typography variant="body1" sx={{ color: darkThemeColors.text.primary }}>
                        {pendingApprovalMessage.text}
                      </Typography>
                    </Paper>
                    
                    <Typography variant="body2" sx={{ 
                      color: darkThemeColors.text.secondary,
                      mb: 3,
                      textAlign: 'center'
                    }}>
                      Would you like to approve this message and start a conversation with this user?
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      mt: 2
                    }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleMessageApproval('reject')}
                        disabled={processingRequest}
                        startIcon={<CancelIcon />}
                        sx={{ 
                          borderColor: '#f44336',
                          color: '#f44336',
                          px: 3,
                          '&:hover': { 
                            bgcolor: alpha('#f44336', 0.1),
                            borderColor: '#d32f2f'
                          }
                        }}
                      >
                        {processingRequest ? 'Rejecting...' : 'Reject'}
                      </Button>
                      
                      <Button
                        variant="contained"
                        onClick={() => handleMessageApproval('approve')}
                        disabled={processingRequest}
                        startIcon={<CheckCircleIcon />}
                        sx={{ 
                          bgcolor: '#4caf50',
                          color: '#fff',
                          px: 3,
                          '&:hover': { bgcolor: '#3d8b40' }
                        }}
                      >
                        {processingRequest ? 'Approving...' : 'Approve'}
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              )}
              
              {/* Waiting for approval overlay - existing code */}
              {isWaitingForFirstApproval && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    bgcolor: alpha(darkThemeColors.background.default, 0.7)
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      p: 3,
                      maxWidth: 400,
                      textAlign: 'center',
                      bgcolor: darkThemeColors.background.paper
                    }}
                  >
                    <Typography variant="h6" sx={{ color: darkThemeColors.text.primary, mb: 1 }}>
                      Waiting for Approval
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkThemeColors.text.secondary }}>
                      Your first message is pending approval from the recipient.
                      You'll be able to continue chatting once they approve it.
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              {/* Use loadingMessages state */}
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress sx={{ color: darkThemeColors.primary.main }} />
                </Box>
              ) : currentMessages.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%'
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: darkThemeColors.text.secondary,
                      textAlign: 'center'
                    }}
                  >
                    No messages yet. Send a message to start the conversation.
                  </Typography>
                </Box>
              ) : (
                <>
                  {/* Group messages by sender for better UI alignment */}
                  {(() => {
                    // Group messages by sender
                    const messageGroups = [];
                    let currentGroup = [];
                    
                    currentMessages.forEach((message, index) => {
                      const isCurrentUser = message.senderId === 'self' || message.senderId === user?.id;
                      
                      // Start a new group if sender changes or it's the first message
                      if (index === 0 || 
                          (currentMessages[index - 1].senderId === 'self' || currentMessages[index - 1].senderId === user?.id) !== isCurrentUser) {
                        if (currentGroup.length > 0) {
                          messageGroups.push(currentGroup);
                        }
                        currentGroup = [message];
                      } else {
                        currentGroup.push(message);
                      }
                    });
                    
                    // Add the last group
                    if (currentGroup.length > 0) {
                      messageGroups.push(currentGroup);
                    }
                    
                    // Render message groups
                    return messageGroups.map((group, groupIndex) => {
                      const isCurrentUser = group[0].senderId === 'self' || group[0].senderId === user?.id;
                      
                      return (
                        <Box 
                          key={`group-${groupIndex}`}
                          sx={{ 
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                            mb: 2, // Consistent margin between groups
                            width: '100%'
                          }}
                        >
                          {/* Contact's avatar - only show once per group */}
                          {!isCurrentUser && (
                            <Avatar 
                              alt={selectedContact.name || 'User'}
                              src={selectedContact.avatar || "/public/profile_default_image.webp"}
                              sx={{ 
                                mr: 1, 
                                width: 32, 
                                height: 32, 
                                alignSelf: 'flex-start',
                                mt: 0.5,
                                bgcolor: darkThemeColors.background.lighter
                              }}
                            >
                              {selectedContact.name?.charAt(0) || '?'}
                            </Avatar>
                          )}
                          
                          {/* Message content column */}
                          <Box 
                            sx={{ 
                              display: 'flex',
                              flexDirection: 'column',
                              maxWidth: 'calc(100% - 80px)', // Leave space for avatar
                              alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                            }}
                          >
                            {/* Sender name - only show once per group */}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block', 
                                mb: 0.5,
                                color: darkThemeColors.text.secondary,
                                textAlign: isCurrentUser ? 'right' : 'left',
                                width: '100%'
                              }}
                            >
                              {isCurrentUser ? 'You' : selectedContact.name || 'Unknown User'}
                            </Typography>
                            
                            {/* Messages in this group */}
                            {group.map((message, messageIndex) => (
                              <Box 
                                key={message.id}
                                sx={{ 
                                  position: 'relative',
                                  mb: messageIndex < group.length - 1 ? 0.5 : 0, // Small gap between messages in same group
                                  maxWidth: '100%'
                                }}
                              >
                                <Paper
                                  elevation={0}
                                  sx={{ 
                                    py: 1,
                                    px: 2,
                                    bgcolor: isCurrentUser ? 
                                      darkThemeColors.primary.main : 
                                      darkThemeColors.background.lighter,
                                    color: isCurrentUser ? 
                                      darkThemeColors.primary.contrastText : 
                                      darkThemeColors.text.primary,
                                    borderRadius: '12px',
                                    maxWidth: '100%',
                                    wordWrap: 'break-word',
                                    boxShadow: isCurrentUser ? 
                                      'none' : 
                                      `0 1px 2px ${alpha('#000', 0.2)}`,
                                    opacity: message.approvalStatus === 'pending' ? 0.7 : 1
                                  }}
                                >
                                  <Typography variant="body2">{message.text}</Typography>
                                </Paper>
                                
                                {/* Show approval status indicator only for first non-booking message */}
                                {message.approvalStatus === 'pending' && 
                                 !message.text.match(/^Your booking request for ".*" has been approved\..*Reference: \w+/i) &&
                                 currentMessages.findIndex(m => m.id === message.id) === 0 && (
                                  <Tooltip 
                                    title={isCurrentUser ? 
                                      "Waiting for approval" : 
                                      "Approve this message to continue the conversation"
                                    }
                                  >
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -8,
                                        right: isCurrentUser ? -8 : 'auto',
                                        left: isCurrentUser ? 'auto' : -8,
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        bgcolor: '#FFA000', // Amber color for pending
                                        border: `2px solid ${darkThemeColors.background.default}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          fontSize: '10px',
                                          color: '#fff',
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        !
                                      </Box>
                                    </Box>
                                  </Tooltip>
                                )}
                                
                                {/* Only show timestamp for the last message in group */}
                                {messageIndex === group.length - 1 && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      mt: 0.5,
                                      color: darkThemeColors.text.secondary,
                                      textAlign: isCurrentUser ? 'right' : 'left'
                                    }}
                                  >
                                    {formatMessageTimestamp(message.timestamp)}
                                    {isCurrentUser && message.status && 
                                     message.status !== 'sent' && 
                                     message.status !== 'received' && 
                                     ` (${message.status})`}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                          
                          {/* User's avatar - only show once per group */}
                          {isCurrentUser && (
                            <Avatar 
                              alt="You"
                              src={userProfile?.avatar || "/public/profile_default_image.webp"}
                              sx={{ 
                                ml: 1, 
                                width: 32, 
                                height: 32, 
                                alignSelf: 'flex-start',
                                mt: 0.5,
                                bgcolor: alpha(darkThemeColors.primary.main, 0.7)
                              }}
                            >
                              {user?.username?.charAt(0).toUpperCase() || 'Y'}
                            </Avatar>
                          )}
                        </Box>
                      );
                    });
                  })()}
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>
            
            {/* Message input */}
            <Box 
              sx={{ 
                p: 2, 
                borderTop: 1, 
                borderColor: darkThemeColors.divider,
                bgcolor: darkThemeColors.background.paper
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center'
              }}>
                <Tooltip title="Attach file">
                  <IconButton 
                    sx={{ 
                      color: darkThemeColors.text.secondary,
                      height: 40,
                      width: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <AttachFileIcon />
                  </IconButton>
                </Tooltip>
                
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  disabled={isSending || isWaitingForFirstApproval} // Disable input if waiting for approval
                  inputRef={messageInputRef}
                  sx={{
                    mx: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '24px',
                      bgcolor: alpha(darkThemeColors.background.lighter, 0.5),
                      '& fieldset': {
                        borderColor: alpha(darkThemeColors.text.primary, 0.2),
                      },
                      '&:hover fieldset': {
                        borderColor: alpha(darkThemeColors.text.primary, 0.3),
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: darkThemeColors.primary.main,
                      },
                      '& textarea': {
                        color: darkThemeColors.text.primary,
                      },
                      minHeight: '48px',
                      display: 'flex',
                      alignItems: 'center'
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end" sx={{ alignSelf: 'center' }}>
                        <Tooltip title="Emoji">
                          <IconButton 
                            edge="end" 
                            onClick={handleEmojiButtonClick}
                            sx={{ 
                              color: darkThemeColors.text.secondary,
                              height: 40,
                              width: 40,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <EmojiEmotionsIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {/* Emoji Picker */}
                <Popper 
                  open={showEmojiPicker} 
                  anchorEl={emojiAnchorEl}
                  placement="top-end"
                  sx={{ zIndex: 1300 }}
                >
                  <ClickAwayListener onClickAway={handleCloseEmojiPicker}>
                    <Paper 
                      elevation={3}
                      sx={{ 
                        bgcolor: darkThemeColors.background.paper,
                        border: `1px solid ${darkThemeColors.divider}`,
                        borderRadius: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        searchDisabled={false}
                        width={320}
                        height={400}
                        previewConfig={{ showPreview: false }}
                        theme="dark"
                      />
                    </Paper>
                  </ClickAwayListener>
                </Popper>
                
                <Tooltip title="Send message">
                  <span>
                    <IconButton 
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      sx={{
                        bgcolor: newMessage.trim() && !isSending ? darkThemeColors.primary.main : 'transparent',
                        color: newMessage.trim() && !isSending ? darkThemeColors.primary.contrastText : darkThemeColors.text.disabled,
                        '&:hover': {
                          bgcolor: newMessage.trim() && !isSending ? darkThemeColors.primary.dark : 'transparent',
                        },
                        height: 40,
                        width: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isSending ? <CircularProgress size={24} sx={{ color: darkThemeColors.primary.main }} /> : <SendIcon />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              {/* Indicator message when waiting for approval */}
              {isWaitingForFirstApproval && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: darkThemeColors.text.secondary, 
                    mt: 1, 
                    textAlign: 'center', 
                    display: 'block' 
                  }}
                >
                  Waiting for recipient to approve your first message. Input disabled until approved.
                </Typography>
              )}
            </Box>
          </>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              p: 3
            }}
          >
            <Box 
              sx={{ 
                bgcolor: darkThemeColors.background.paper,
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
                maxWidth: 400,
                border: `1px solid ${darkThemeColors.divider}`,
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: darkThemeColors.text.primary }}>
                Select a conversation
              </Typography>
              <Typography variant="body2" sx={{ color: darkThemeColors.text.secondary }}>
                {searchTerm ? 
                  "Search for users to message by entering their username or email." :
                  "Choose a contact from the list to start chatting, or search for someone new."
                }
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <ArrowForwardIcon 
                  sx={{ 
                    transform: 'rotate(180deg)', 
                    color: darkThemeColors.primary.main 
                  }} 
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Keep the existing request dialog for viewing all pending requests */}
      <Dialog
        open={requestDialogOpen}
        onClose={() => setRequestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: darkThemeColors.background.paper,
            color: darkThemeColors.text.primary,
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${darkThemeColors.divider}` }}>
          Message Requests
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {loadingPendingRequests ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: darkThemeColors.primary.main }} />
            </Box>
          ) : pendingRequests?.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: darkThemeColors.text.secondary }}>
                No pending message requests
              </Typography>
            </Box>
          ) : (
            <List sx={{ pt: 0 }}>
              {(pendingRequests?.length > 0) && pendingRequests.map(request => (
                <ListItem 
                  key={request.id}
                  sx={{ 
                    borderBottom: `1px solid ${darkThemeColors.divider}`,
                    py: 2
                  }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      alt={request.senderName}
                      src={request.senderAvatar || "/public/profile_default_image.webp"}
                      sx={{ bgcolor: alpha(darkThemeColors.primary.main, 0.7) }}
                    >
                      {request.senderName?.charAt(0) || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" sx={{ color: darkThemeColors.text.primary }}>
                        {request.senderName}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: darkThemeColors.text.secondary,
                            mb: 1
                          }}
                        >
                          {request.text}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkThemeColors.text.secondary }}>
                          {formatMessageTimestamp(request.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2, gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => handleRequestResponse(request.id, 'approve')}
                      disabled={processingRequest}
                      startIcon={<CheckCircleIcon />}
                      sx={{ 
                        bgcolor: '#4caf50',
                        color: '#fff',
                        '&:hover': { bgcolor: '#3d8b40' }
                      }}
                    >
                      Approve
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={() => handleRequestResponse(request.id, 'reject')}
                      disabled={processingRequest}
                      startIcon={<CancelIcon />}
                      sx={{ 
                        borderColor: '#f44336',
                        color: '#f44336',
                        '&:hover': { 
                          bgcolor: alpha('#f44336', 0.1),
                          borderColor: '#d32f2f'
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        
        <DialogActions sx={{ borderTop: `1px solid ${darkThemeColors.divider}`, p: 2 }}>
          <Button 
            onClick={() => setRequestDialogOpen(false)}
            sx={{ 
              color: darkThemeColors.text.primary,
              '&:hover': { bgcolor: alpha(darkThemeColors.text.primary, 0.1) }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar 
        open={!!notification} 
        autoHideDuration={6000} 
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notificationType} 
          sx={{ 
            width: '100%',
            color: darkThemeColors.text.primary,
            '& .MuiAlert-message': { color: darkThemeColors.text.primary },
            '& .MuiAlert-icon': { color: darkThemeColors.text.primary }
          }}
        >
          {notification}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Messages;
