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

    const validStatuses = ['interested', 'nda_signed', 'due_diligence', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status for this action. Must be one of: ${validStatuses.join(', ')}. To close a deal, use the dedicated close endpoint, which calculates the success fee and requires both parties to confirm.`,
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
// UPDATE DUE DILIGENCE CHECKLIST ITEM
// PATCH /api/deal-rooms/:id/checklist
// ============================================

const CHECKLIST_ITEMS = ['financials', 'capTable', 'legalDocuments', 'teamBackgrounds'];

export const updateChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { item, completed } = req.body;
    const userId = req.user._id;

    if (!CHECKLIST_ITEMS.includes(item)) {
      return res.status(400).json({
        success: false,
        message: `Invalid checklist item. Must be one of: ${CHECKLIST_ITEMS.join(', ')}`,
      });
    }

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: '"completed" must be true or false',
      });
    }

    const dealRoom = await DealRoom.findById(id);

    if (!dealRoom) {
      return res.status(404).json({
        success: false,
        message: 'Deal room not found',
      });
    }

    const isParticipant = dealRoom.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this deal room',
      });
    }

    if (!dealRoom.dueDiligenceChecklist) {
      dealRoom.dueDiligenceChecklist = {};
    }

    dealRoom.dueDiligenceChecklist[item] = {
      completed,
      completedBy: completed ? userId : null,
      completedAt: completed ? new Date() : null,
    };

    const itemLabel = item.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
    dealRoom.activityLog.push({
      action: completed ? 'Checklist Item Completed' : 'Checklist Item Reopened',
      description: `${itemLabel} marked as ${completed ? 'complete' : 'incomplete'}`,
      timestamp: new Date(),
      userId,
    });

    await dealRoom.save();

    res.status(200).json({
      success: true,
      message: 'Checklist updated',
      data: dealRoom,
    });
  } catch (error) {
    console.error('Update checklist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update checklist',
    });
  }
};

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
    const { amount } = req.body;
    const userId = req.user._id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid closing amount is required',
      });
    }

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

    const existingProposal = dealRoom.closeProposal;

    // No proposal yet, or the same person is updating their own proposed amount:
    // record/update the proposal and wait for the other participant to confirm.
    if (!existingProposal || existingProposal.proposedBy.toString() === userId.toString()) {
      dealRoom.closeProposal = {
        amount,
        proposedBy: userId,
        proposedAt: new Date(),
      };

      dealRoom.activityLog.push({
        action: 'Close Proposed',
        description: `Proposed closing this deal at $${amount.toLocaleString()}. Awaiting confirmation from the other party.`,
        timestamp: new Date(),
        userId,
      });

      await dealRoom.save();

      const otherParticipants = dealRoom.participants.filter(
        p => p.userId.toString() !== userId.toString()
      );
      for (const participant of otherParticipants) {
        await Notification.create({
          userId: participant.userId,
          type: 'deal_close_proposed',
          title: 'Deal close proposed',
          message: `The other party proposed closing this deal at $${amount.toLocaleString()}. Confirm to finalize.`,
          data: { dealRoomId: dealRoom._id },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Close proposed. Waiting for the other party to confirm.',
        data: dealRoom,
      });
    }

    // A proposal exists from the OTHER participant - this call is a confirmation.
    // The amount must match what was proposed, so both sides are agreeing to the
    // same number rather than one side silently overriding the other's figure.
    if (existingProposal.amount !== amount) {
      return res.status(400).json({
        success: false,
        message: `The proposed amount was $${existingProposal.amount.toLocaleString()}. Confirm with that exact amount, or propose a new one.`,
      });
    }

    // Fee percentage is never taken from the client - always the rate already
    // stored on this deal room (platform default, admin-adjustable only via
    // a separate admin-only action, never by a participant closing a deal).
    const feePercentage = dealRoom.feePercentage;
    const feeAmount = (amount * feePercentage) / 100;

    dealRoom.status = 'closed';
    dealRoom.amount = amount;
    dealRoom.feeAmount = feeAmount;
    dealRoom.closedAt = new Date();
    dealRoom.closedBy = userId;
    dealRoom.closeProposal = undefined;

    dealRoom.activityLog.push({
      action: 'Deal Closed',
      description: `Deal closed with investment of $${amount.toLocaleString()}. Success fee: $${feeAmount.toLocaleString()}`,
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
          ? `Your deal with ${dealRoom.matchId.investorId.name} has closed for $${amount.toLocaleString()}! Success fee: $${feeAmount.toLocaleString()}`
          : `Your deal with ${dealRoom.matchId.founderId.name} has closed for $${amount.toLocaleString()}!`,
        data: {
          dealRoomId: dealRoom._id,
          amount: amount,
          feeAmount: feeAmount,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Deal closed successfully',
      data: {
        dealRoom,
        amount: amount,
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

    const [totalInterested, totalNdaSigned, totalDueDiligence, totalClosed] = await Promise.all([
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'interested'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'nda_signed'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'due_diligence'
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
        interested: totalInterested,
        ndaSigned: totalNdaSigned,
        dueDiligence: totalDueDiligence,
        closed: totalClosed,
        total: totalInterested + totalNdaSigned + totalDueDiligence + totalClosed,
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
  updateChecklistItem,
  getDealRoomById,
  patchDealRoomStatus,
  getDealRoomDocuments,
  uploadDocument,
  deleteDocument,
  getDealRoomActivity,
  closeDeal,
  getDealRoomStats,
};