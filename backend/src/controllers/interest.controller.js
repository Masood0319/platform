import Interest from "../models/interest.model.js";
import Startup from "../models/startup.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// ============================================
// CREATE INTEREST
// POST /api/interests
// ============================================

export const createInterest = async (req, res) => {
  try {
    const { startupId, investorId, message } = req.body;
    
    // Validate user role
    if (req.user.role === 'founder' && !investorId) {
      return res.status(400).json({
        success: false,
        message: 'Founders must specify an investorId',
      });
    }

    if (req.user.role === 'investor' && !startupId) {
      return res.status(400).json({
        success: false,
        message: 'Investors must specify a startupId',
      });
    }

    // Determine sender and receiver
    const senderId = req.user._id;
    let receiverId;
    let finalStartupId = startupId;
    let finalInvestorId = investorId;

    if (req.user.role === 'founder') {
      receiverId = investorId;
      finalInvestorId = investorId;
      // Check if startup exists
      const startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }
      finalStartupId = startupId;
    } else {
      // Investor sending interest
      const startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({
          success: false,
          message: 'Startup not found',
        });
      }
      receiverId = startup.ownerId;
      finalStartupId = startupId;
      finalInvestorId = senderId;
    }

    // Check for existing interest
    const existingInterest = await Interest.findOne({
      $or: [
        { senderId, receiverId, startupId: finalStartupId, status: 'pending' },
        { senderId: receiverId, receiverId: senderId, startupId: finalStartupId, status: 'pending' },
      ],
    });

    if (existingInterest) {
      return res.status(400).json({
        success: false,
        message: 'An interest already exists between these parties',
      });
    }

    // Create interest
    const interest = await Interest.create({
      senderId,
      receiverId,
      startupId: finalStartupId,
      investorId: finalInvestorId,
      status: 'pending',
      message: message || '',
    });

    // Update startup interest count
    await Startup.findByIdAndUpdate(finalStartupId, { $inc: { interestCount: 1 } });

    // Create notification for receiver
    await Notification.create({
      userId: receiverId,
      type: 'interest_received',
      title: 'New Interest',
      message: `${req.user.name} has expressed interest in your ${req.user.role === 'founder' ? 'startup' : 'investment opportunity'}`,
      data: {
        interestId: interest._id,
        senderId: req.user._id,
        startupId: finalStartupId,
      },
    });

    // Check for mutual match (if the other party already expressed interest)
    const match = await checkAndCreateMutualMatch(interest);

    res.status(201).json({
      success: true,
      data: {
        interest,
        match: match || null,
      },
    });
  } catch (error) {
    console.error('Create interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to express interest',
    });
  }
};

// ============================================
// GET RECEIVED INTERESTS
// GET /api/interests/received
// ============================================

export const getReceivedInterests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { receiverId: userId };
    if (status) query.status = status;

    const interests = await Interest.find(query)
      .populate('senderId', 'name email profilePicture role')
      .populate('startupId', 'startupName logo sector')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Interest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: interests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: interests,
    });
  } catch (error) {
    console.error('Get received interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch received interests',
    });
  }
};

// ============================================
// GET SENT INTERESTS
// GET /api/interests/sent
// ============================================

export const getSentInterests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { senderId: userId };
    if (status) query.status = status;

    const interests = await Interest.find(query)
      .populate('receiverId', 'name email profilePicture role')
      .populate('startupId', 'startupName logo sector')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Interest.countDocuments(query);

    res.status(200).json({
      success: true,
      count: interests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: interests,
    });
  } catch (error) {
    console.error('Get sent interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sent interests',
    });
  }
};

// ============================================
// GET INTEREST BY ID
// GET /api/interests/:id
// ============================================

export const getInterestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interest = await Interest.findById(id)
      .populate('senderId', 'name email profilePicture role')
      .populate('receiverId', 'name email profilePicture role')
      .populate('startupId', 'startupName logo sector description')
      .lean();

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found',
      });
    }

    // Check if user is participant
    if (interest.senderId._id.toString() !== userId.toString() && 
        interest.receiverId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this interest',
      });
    }

    res.status(200).json({
      success: true,
      data: interest,
    });
  } catch (error) {
    console.error('Get interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interest',
    });
  }
};

// ============================================
// GET INTEREST STATS
// GET /api/interests/stats
// ============================================

export const getInterestStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [received, sent, pending, accepted, declined] = await Promise.all([
      Interest.countDocuments({ receiverId: userId }),
      Interest.countDocuments({ senderId: userId }),
      Interest.countDocuments({
        $or: [{ senderId: userId }, { receiverId: userId }],
        status: 'pending',
      }),
      Interest.countDocuments({
        $or: [{ senderId: userId }, { receiverId: userId }],
        status: 'accepted',
      }),
      Interest.countDocuments({
        $or: [{ senderId: userId }, { receiverId: userId }],
        status: 'declined',
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        received,
        sent,
        pending,
        accepted,
        declined,
        total: received + sent,
      },
    });
  } catch (error) {
    console.error('Get interest stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interest statistics',
    });
  }
};

// ============================================
// ACCEPT INTEREST
// PATCH /api/interests/:id/accept
// ============================================

export const acceptInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interest = await Interest.findById(id)
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .populate('startupId');

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found',
      });
    }

    // Ensure user is the receiver
    if (interest.receiverId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to accept this interest',
      });
    }

    if (interest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept interest with status: ${interest.status}`,
      });
    }

    // Update interest status
    interest.status = 'accepted';
    interest.respondedAt = new Date();
    await interest.save();

    // Create notification for sender
    await Notification.create({
      userId: interest.senderId._id,
      type: 'interest_accepted',
      title: 'Interest Accepted! 🎉',
      message: `${req.user.name} has accepted your interest`,
      data: {
        interestId: interest._id,
      },
    });

    // Check for mutual match and create if exists
    const match = await checkAndCreateMutualMatch(interest);

    res.status(200).json({
      success: true,
      message: 'Interest accepted',
      data: {
        interest,
        match: match || null,
      },
    });
  } catch (error) {
    console.error('Accept interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept interest',
    });
  }
};

// ============================================
// DECLINE INTEREST
// PATCH /api/interests/:id/decline
// ============================================

export const declineInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interest = await Interest.findById(id)
      .populate('senderId', 'name email');

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found',
      });
    }

    // Ensure user is the receiver
    if (interest.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to decline this interest',
      });
    }

    if (interest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot decline interest with status: ${interest.status}`,
      });
    }

    // Update interest status
    interest.status = 'declined';
    interest.respondedAt = new Date();
    await interest.save();

    // Notify sender
    await Notification.create({
      userId: interest.senderId._id,
      type: 'interest_declined',
      title: 'Interest Declined',
      message: `${req.user.name} has declined your interest`,
      data: {
        interestId: interest._id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Interest declined',
      data: interest,
    });
  } catch (error) {
    console.error('Decline interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline interest',
    });
  }
};

// ============================================
// CANCEL INTEREST (Sender only)
// DELETE /api/interests/:id
// ============================================

export const cancelInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const interest = await Interest.findById(id);

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Interest not found',
      });
    }

    // Ensure user is the sender
    if (interest.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this interest',
      });
    }

    if (interest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel interest with status: ${interest.status}`,
      });
    }

    // Update interest status
    interest.status = 'cancelled';
    await interest.save();

    res.status(200).json({
      success: true,
      message: 'Interest cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel interest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel interest',
    });
  }
};

// ============================================
// HELPER: Check and create mutual match
// ============================================

const checkAndCreateMutualMatch = async (interest) => {
  try {
    // Find reciprocal interest
    const reciprocalInterest = await Interest.findOne({
      senderId: interest.receiverId._id,
      receiverId: interest.senderId._id,
      startupId: interest.startupId._id || interest.startupId,
      status: { $in: ['pending', 'accepted'] },
    });

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { founderId: interest.senderId._id, investorId: interest.receiverId._id },
        { founderId: interest.receiverId._id, investorId: interest.senderId._id },
      ],
      startupId: interest.startupId._id || interest.startupId,
    });

    if (!reciprocalInterest || existingMatch) {
      return null;
    }

    // Determine founder and investor
    let founderId, investorId;
    const startupId = interest.startupId._id || interest.startupId;

    // Find which user is the founder (owner of startup)
    const startup = await Startup.findById(startupId);
    if (!startup) {
      return null;
    }

    founderId = startup.ownerId;
    investorId = (interest.senderId._id.toString() === founderId.toString()) 
      ? interest.receiverId._id 
      : interest.senderId._id;

    // Create match
    const match = await Match.create({
      founderId,
      investorId,
      startupId,
      status: 'active',
      matchedAt: new Date(),
    });

    // Create deal room
    const dealRoom = await DealRoom.create({
      matchId: match._id,
      participants: [
        { userId: founderId, role: 'founder' },
        { userId: investorId, role: 'investor' },
      ],
      status: 'active',
      activityLog: [
        {
          action: 'Match Created',
          description: 'Mutual interest established. Deal room opened.',
          timestamp: new Date(),
        },
      ],
    });

    // Update match with dealRoomId
    match.dealRoomId = dealRoom._id;
    await match.save();

    // Create notifications for both parties
    await Notification.create({
      userId: founderId,
      type: 'match_created',
      title: '🎉 It\'s a Match!',
      message: `You and ${investorId} have mutually expressed interest. Deal room is now open.`,
      data: { matchId: match._id, dealRoomId: dealRoom._id },
    });

    await Notification.create({
      userId: investorId,
      type: 'match_created',
      title: '🎉 It\'s a Match!',
      message: `You and ${founderId} have mutually expressed interest. Deal room is now open.`,
      data: { matchId: match._id, dealRoomId: dealRoom._id },
    });

    return match;
  } catch (error) {
    console.error('Mutual match creation error:', error);
    return null;
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  createInterest,
  getReceivedInterests,
  getSentInterests,
  getInterestById,
  getInterestStats,
  acceptInterest,
  declineInterest,
  cancelInterest,
};