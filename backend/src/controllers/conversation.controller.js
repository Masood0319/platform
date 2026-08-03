import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Notification from "../models/notification.model.js";

// ============================================
// GET MY CONVERSATIONS
// GET /api/conversations
// ============================================

export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
    })
      .populate('participants', 'name email profilePicture')
      .populate('lastMessage')
      .populate('dealRoomId', 'status')
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Conversation.countDocuments({
      participants: userId,
      isActive: true,
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          readBy: { $ne: userId },
          senderId: { $ne: userId },
        });
        return {
          ...conv,
          unreadCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: conversationsWithUnread.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: conversationsWithUnread,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
    });
  }
};

// ============================================
// GET CONVERSATION BY ID
// GET /api/conversations/:id
// ============================================

export const getConversationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email profilePicture')
      .populate('lastMessage')
      .populate('dealRoomId', 'status')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this conversation',
      });
    }

    // Get unread count
    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      readBy: { $ne: userId },
      senderId: { $ne: userId },
    });

    res.status(200).json({
      success: true,
      data: {
        ...conversation,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation',
    });
  }
};

// ============================================
// GET OR CREATE CONVERSATION
// POST /api/conversations
// ============================================

export const getOrCreateConversation = async (req, res) => {
  try {
    const { participantId, dealRoomId, matchId } = req.body;
    const userId = req.user._id;

    // Validate participant
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, participantId] },
      isActive: true,
    });

    if (conversation) {
      return res.status(200).json({
        success: true,
        data: conversation,
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participants: [userId, participantId],
      dealRoomId: dealRoomId || null,
      matchId: matchId || null,
      isActive: true,
      lastMessageAt: new Date(),
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email profilePicture')
      .lean();

    res.status(201).json({
      success: true,
      data: populatedConversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation',
    });
  }
};

// ============================================
// DELETE CONVERSATION
// DELETE /api/conversations/:id
// ============================================

export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this conversation',
      });
    }

    // Soft delete - mark as inactive
    conversation.isActive = false;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete conversation',
    });
  }
};

// ============================================
// GET UNREAD COUNT
// GET /api/conversations/unread
// ============================================

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all conversations for user
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
    }).select('_id');

    const conversationIds = conversations.map(c => c._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      readBy: { $ne: userId },
      senderId: { $ne: userId },
    });

    res.status(200).json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
};

// ============================================
// MARK CONVERSATION AS READ
// PATCH /api/conversations/:id/read
// ============================================

export const markConversationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this conversation',
      });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        conversationId: id,
        readBy: { $ne: userId },
        senderId: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        readAt: new Date(),
      }
    );

    // Update unread count
    const unreadCount = await Message.countDocuments({
      conversationId: id,
      readBy: { $ne: userId },
      senderId: { $ne: userId },
    });

    conversation.unreadCount = unreadCount;
    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
    });
  }
};

// ============================================
// GET CONVERSATION MESSAGES
// GET /api/conversations/:id/messages
// ============================================

export const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these messages',
      });
    }

    const messages = await Message.find({
      conversationId: id,
      isDeleted: false,
    })
      .populate('senderId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Message.countDocuments({
      conversationId: id,
      isDeleted: false,
    });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: id,
        readBy: { $ne: userId },
        senderId: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: messages.reverse(), // Return in chronological order
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
};

// ============================================
// SEND MESSAGE
// POST /api/conversations/:id/messages
// ============================================

export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, type = 'text', fileUrl, fileName, fileSize } = req.body;
    const userId = req.user._id;

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or file is required',
      });
    }

    const conversation = await Conversation.findById(id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send messages',
      });
    }

    // Create message
    const message = await Message.create({
      conversationId: id,
      senderId: userId,
      content: content || '',
      type,
      fileUrl: fileUrl || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      readBy: [userId],
      readAt: new Date(),
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email profilePicture')
      .lean();

    // Notify other participants
    const otherParticipants = conversation.participants.filter(
      p => p.toString() !== userId.toString()
    );

    for (const participantId of otherParticipants) {
      await Notification.create({
        userId: participantId,
        type: 'new_message',
        title: 'New Message',
        message: `${req.user.name} sent you a message`,
        data: {
          conversationId: conversation._id,
          messageId: message._id,
        },
      });
    }

    // Emit socket event (handled in socket handler)

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
    });
  }
};

// ============================================
// GET CONVERSATION PARTICIPANTS
// GET /api/conversations/:id/participants
// ============================================

export const getConversationParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(id)
      .populate('participants', 'name email profilePicture')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    // Check if user is participant
    if (!conversation.participants.some(p => p._id.toString() === userId.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view participants',
      });
    }

    res.status(200).json({
      success: true,
      data: conversation.participants,
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getMyConversations,
  getConversationById,
  getOrCreateConversation,
  deleteConversation,
  getUnreadCount,
  markConversationAsRead,
  getConversationMessages,
  sendMessage,
  getConversationParticipants,
};