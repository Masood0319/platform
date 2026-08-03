import DealRoom from "../models/dealRoom.model.js";
import Match from "../models/match.model.js";
import Startup from "../models/startup.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service.js";

// ============================================
// GET MY DEAL ROOMS
// GET /api/deal-rooms
// ============================================

export const getMyDealRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      'participants.userId': userId,
    };
    if (status) query.status = status;

    const dealRooms = await DealRoom.find(query)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'founderId', select: 'name email profilePicture' },
          { path: 'investorId', select: 'name email profilePicture' },
          { path: 'startupId', select: 'startupName logo sector stage fundingTarget' },
        ],
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await DealRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      count: dealRooms.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: dealRooms,
    });
  } catch (error) {
    console.error('Get my deal rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal rooms',
    });
  }
};

// ============================================
// GET DEAL ROOM BY ID
// GET /api/deal-rooms/:id
// ============================================

export const getDealRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const dealRoom = await DealRoom.findById(id)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'founderId', select: 'name email profilePicture bio location' },
          { path: 'investorId', select: 'name email profilePicture investorProfile' },
          { path: 'startupId', select: 'startupName logo sector stage fundingTarget description' },
        ],
      })
      .populate('participants.userId', 'name email profilePicture')
      .populate('documents.uploadedBy', 'name email')
      .populate('activityLog.userId', 'name email')
      .lean();

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Check if user is participant
    const isParticipant = dealRoom.participants.some(
      p => p.userId._id.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this deal room',
      });
    }

    res.status(200).json({
      success: true,
      data: dealRoom,
    });
  } catch (error) {
    console.error('Get deal room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal room',
    });
  }
};

// ============================================
// UPDATE DEAL ROOM STATUS
// PATCH /api/deal-rooms/:id/status
// ============================================

export const patchDealRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    const validStatuses = ['active', 'due_diligence', 'negotiation', 'closed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const dealRoom = await DealRoom.findById(id);

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Check if user is participant
    const isParticipant = dealRoom.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this deal room',
      });
    }

    dealRoom.status = status;
    
    // Add to activity log
    dealRoom.activityLog.push({
      action: 'Status Updated',
      description: `Deal status changed to "${status}"`,
      timestamp: new Date(),
      userId,
    });

    await dealRoom.save();

    // Notify other participants
    const otherParticipants = dealRoom.participants.filter(
      p => p.userId.toString() !== userId.toString()
    );

    for (const participant of otherParticipants) {
      await Notification.create({
        userId: participant.userId,
        type: 'deal_status_update',
        title: 'Deal Status Updated',
        message: `Deal status has been updated to "${status}"`,
        data: {
          dealRoomId: dealRoom._id,
          status,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deal status updated successfully',
      data: dealRoom,
    });
  } catch (error) {
    console.error('Update deal status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deal status',
    });
  }
};

// ============================================
// GET DEAL ROOM DOCUMENTS
// GET /api/deal-rooms/:id/documents
// ============================================

export const getDealRoomDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const dealRoom = await DealRoom.findById(id)
      .select('documents participants')
      .populate('documents.uploadedBy', 'name email')
      .lean();

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Check if user is participant
    const isParticipant = dealRoom.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these documents',
      });
    }

    res.status(200).json({
      success: true,
      data: dealRoom.documents || [],
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
    });
  }
};

// ============================================
// UPLOAD DOCUMENT
// POST /api/deal-rooms/:id/documents
// ============================================

export const uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a document',
      });
    }

    const dealRoom = await DealRoom.findById(id);

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Check if user is participant
    const isParticipant = dealRoom.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to upload documents',
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      folder: `deal-rooms/${id}`,
      resource_type: 'auto',
    });

    // Add document to deal room
    const document = {
      name: name || req.file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      type: type || 'other',
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    dealRoom.documents.push(document);
    
    // Add to activity log
    dealRoom.activityLog.push({
      action: 'Document Uploaded',
      description: `${req.user.name} uploaded "${document.name}"`,
      timestamp: new Date(),
      userId,
    });

    await dealRoom.save();

    // Notify other participants
    const otherParticipants = dealRoom.participants.filter(
      p => p.userId.toString() !== userId.toString()
    );

    for (const participant of otherParticipants) {
      await Notification.create({
        userId: participant.userId,
        type: 'document_uploaded',
        title: 'New Document Uploaded',
        message: `${req.user.name} uploaded a new document: "${document.name}"`,
        data: {
          dealRoomId: dealRoom._id,
          document: document,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
    });
  }
};

// ============================================
// DELETE DOCUMENT
// DELETE /api/deal-rooms/:id/documents/:docId
// ============================================

export const deleteDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    const userId = req.user._id;

    const dealRoom = await DealRoom.findById(id);

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Find document
    const docIndex = dealRoom.documents.findIndex(d => d._id.toString() === docId);

    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const document = dealRoom.documents[docIndex];

    // Check if user uploaded the document or is admin
    if (document.uploadedBy.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document',
      });
    }

    // Delete from Cloudinary
    if (document.publicId) {
      await deleteFromCloudinary(document.publicId);
    }

    // Remove document from array
    dealRoom.documents.splice(docIndex, 1);

    // Add to activity log
    dealRoom.activityLog.push({
      action: 'Document Deleted',
      description: `${req.user.name} deleted "${document.name}"`,
      timestamp: new Date(),
      userId,
    });

    await dealRoom.save();

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
    });
  }
};

// ============================================
// GET DEAL ROOM ACTIVITY
// GET /api/deal-rooms/:id/activity
// ============================================

export const getDealRoomActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const dealRoom = await DealRoom.findById(id)
      .select('activityLog participants')
      .populate('activityLog.userId', 'name email')
      .lean();

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Check if user is participant
    const isParticipant = dealRoom.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this activity',
      });
    }

    res.status(200).json({
      success: true,
      data: dealRoom.activityLog || [],
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
    });
  }
};

// ============================================
// CLOSE DEAL (with success fee)
// POST /api/deal-rooms/:id/close
// ============================================

export const closeDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, feePercentage = 3 } = req.body;
    const userId = req.user._id;

    const dealRoom = await DealRoom.findById(id)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'founderId', select: 'name email' },
          { path: 'investorId', select: 'name email' },
          { path: 'startupId', select: 'startupName' },
        ],
      });

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    // Check if user is participant
    const isParticipant = dealRoom.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to close this deal',
      });
    }

    if (dealRoom.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Deal is already closed',
      });
    }

    // Calculate fee
    const finalAmount = amount || dealRoom.amount || 0;
    const feeAmount = (finalAmount * feePercentage) / 100;

    // Update deal room
    dealRoom.status = 'closed';
    dealRoom.amount = finalAmount;
    dealRoom.feePercentage = feePercentage;
    dealRoom.feeAmount = feeAmount;
    dealRoom.closedAt = new Date();
    dealRoom.closedBy = userId;

    // Add to activity log
    dealRoom.activityLog.push({
      action: 'Deal Closed',
      description: `Deal closed with investment of $${finalAmount.toLocaleString()}. Success fee: $${feeAmount.toLocaleString()}`,
      timestamp: new Date(),
      userId,
    });

    await dealRoom.save();

    // Update match status
    await Match.findByIdAndUpdate(dealRoom.matchId._id, {
      status: 'completed',
    });

    // Notify all participants
    for (const participant of dealRoom.participants) {
      const isFounder = participant.role === 'founder';
      await Notification.create({
        userId: participant.userId,
        type: 'deal_closed',
        title: '🎉 Deal Closed!',
        message: isFounder 
          ? `Your deal with ${dealRoom.matchId.investorId.name} has closed for $${finalAmount.toLocaleString()}! Success fee: $${feeAmount.toLocaleString()}`
          : `Your deal with ${dealRoom.matchId.founderId.name} has closed for $${finalAmount.toLocaleString()}!`,
        data: {
          dealRoomId: dealRoom._id,
          amount: finalAmount,
          feeAmount: feeAmount,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deal closed successfully',
      data: {
        dealRoom,
        amount: finalAmount,
        feeAmount: feeAmount,
        feePercentage: feePercentage,
      },
    });
  } catch (error) {
    console.error('Close deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to close deal',
    });
  }
};

// ============================================
// GET DEAL ROOM STATS
// GET /api/deal-rooms/stats
// ============================================

export const getDealRoomStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalActive, totalDueDiligence, totalNegotiation, totalClosed] = await Promise.all([
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'active'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'due_diligence'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'negotiation'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'closed'
      }),
    ]);

    // Get total investment and fees
    const totals = await DealRoom.aggregate([
      {
        $match: {
          'participants.userId': userId,
          status: 'closed',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalFees: { $sum: '$feeAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        active: totalActive,
        dueDiligence: totalDueDiligence,
        negotiation: totalNegotiation,
        closed: totalClosed,
        total: totalActive + totalDueDiligence + totalNegotiation + totalClosed,
        totalAmount: totals[0]?.totalAmount || 0,
        totalFees: totals[0]?.totalFees || 0,
        totalDeals: totals[0]?.count || 0,
      },
    });
  } catch (error) {
    console.error('Get deal room stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal room statistics',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getMyDealRooms,
  getDealRoomById,
  patchDealRoomStatus,
  getDealRoomDocuments,
  uploadDocument,
  deleteDocument,
  getDealRoomActivity,
  closeDeal,
  getDealRoomStats,
};