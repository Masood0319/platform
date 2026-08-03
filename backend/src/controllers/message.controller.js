import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Notification from "../models/notification.model.js";

// ============================================
// GET MESSAGES FOR A CONVERSATION
// GET /api/messages/:conversationId
// ============================================

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access',
      });
    }

    const messages = await Message.find({
      conversationId,
      isDeleted: false,
    })
      .populate('senderId', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Message.countDocuments({
      conversationId,
      isDeleted: false,
    });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        readBy: { $ne: userId },
        senderId: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        readAt: new Date(),
      }
    );

    // Update conversation unread count
    const unreadCount = await Message.countDocuments({
      conversationId,
      readBy: { $ne: userId },
      senderId: { $ne: userId },
    });

    await Conversation.findByIdAndUpdate(conversationId, { unreadCount });

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
// POST /api/messages
// ============================================

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type = 'text', fileUrl, fileName, fileSize } = req.body;
    const userId = req.user._id;

    if (!content && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message content or file is required',
      });
    }

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access',
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
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
// DELETE MESSAGE (Soft delete - own messages only)
// DELETE /api/messages/:id
// ============================================

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this message',
      });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message',
    });
  }
};

// ============================================
// MARK MESSAGES AS READ
// PUT /api/messages/read
// ============================================

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required',
      });
    }

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access',
      });
    }

    // Mark all messages as read
    const result = await Message.updateMany(
      {
        conversationId,
        readBy: { $ne: userId },
        senderId: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId },
        readAt: new Date(),
      }
    );

    // Update conversation unread count
    const unreadCount = await Message.countDocuments({
      conversationId,
      readBy: { $ne: userId },
      senderId: { $ne: userId },
    });

    await Conversation.findByIdAndUpdate(conversationId, { unreadCount });

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      data: {
        markedCount: result.modifiedCount || 0,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
    });
  }
};

// ============================================
// GET UNREAD COUNT (Total across all conversations)
// GET /api/messages/unread-count
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
// SHARE EMAIL (After 5 messages)
// POST /api/messages/:conversationId/share-email
// ============================================

export const shareEmail = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access',
      });
    }

    // Count messages in conversation
    const messageCount = await Message.countDocuments({
      conversationId,
      isDeleted: false,
    });

    // Check if enough messages have been exchanged (5+)
    if (messageCount < 5) {
      return res.status(400).json({
        success: false,
        message: `You need to exchange at least 5 messages before sharing email. Current: ${messageCount}`,
      });
    }

    // Get both participants
    const participants = await User.find({
      _id: { $in: conversation.participants },
    }).select('name email');

    // Return emails to both participants
    res.status(200).json({
      success: true,
      message: 'Emails shared successfully',
      data: {
        participants: participants.map(p => ({
          name: p.name,
          email: p.email,
        })),
        messageCount,
      },
    });
  } catch (error) {
    console.error('Share email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share emails',
    });
  }
};

// ============================================
// GET CONVERSATION PARTICIPANTS
// GET /api/messages/:conversationId/participants
// ============================================

export const getConversationParticipants = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true,
    }).populate('participants', 'name email profilePicture');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you do not have access',
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
// UPLOAD FILE TO MESSAGE
// POST /api/messages/upload
// ============================================

export const uploadMessageFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Upload to Cloudinary or your storage service
    // This assumes you have a file upload service
    const { uploadToCloudinary } = await import('../services/upload.service.js');
    
    const result = await uploadToCloudinary(req.file.path, {
      folder: `messages/${req.user._id}`,
      resource_type: 'auto',
    });

    res.status(200).json({
      success: true,
      data: {
        fileUrl: result.secure_url,
        publicId: result.public_id,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getMessages,
  sendMessage,
  deleteMessage,
  markMessagesAsRead,
  getUnreadCount,
  shareEmail,
  getConversationParticipants,
  uploadMessageFile,
};