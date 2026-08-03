import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Startup from "../models/startup.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

// ============================================
// GET MY MATCHES
// GET /api/matches
// ============================================

export const getMyMatches = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      $or: [
        { founderId: userId },
        { investorId: userId }
      ]
    };
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate('founderId', 'name email profilePicture')
      .populate('investorId', 'name email profilePicture')
      .populate('startupId', 'startupName logo sector stage fundingTarget')
      .populate('dealRoomId')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.status(200).json({
      success: true,
      count: matches.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: matches,
    });
  } catch (error) {
    console.error('Get my matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
    });
  }
};

// ============================================
// GET MATCH BY ID
// GET /api/matches/:id
// ============================================

export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const match = await Match.findById(id)
      .populate('founderId', 'name email profilePicture bio location')
      .populate('investorId', 'name email profilePicture investorProfile')
      .populate('startupId', 'startupName logo sector stage fundingTarget description')
      .populate('dealRoomId')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Check if user is participant
    if (match.founderId._id.toString() !== userId.toString() && 
        match.investorId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this match',
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match',
    });
  }
};

// ============================================
// GET MATCH BY DEAL ROOM ID
// GET /api/matches/deal-room/:dealRoomId
// ============================================

export const getMatchByDealRoom = async (req, res) => {
  try {
    const { dealRoomId } = req.params;
    const userId = req.user._id;

    const match = await Match.findOne({ dealRoomId })
      .populate('founderId', 'name email profilePicture bio location')
      .populate('investorId', 'name email profilePicture investorProfile')
      .populate('startupId', 'startupName logo sector stage fundingTarget description')
      .populate('dealRoomId')
      .lean();

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found for this deal room',
      });
    }

    // Check if user is participant
    if (match.founderId._id.toString() !== userId.toString() && 
        match.investorId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this match',
      });
    }

    res.status(200).json({
      success: true,
      data: match,
    });
  } catch (error) {
    console.error('Get match by deal room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match',
    });
  }
};

// ============================================
// GET MATCH STATS
// GET /api/matches/stats
// ============================================

export const getMatchStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalActive, totalCompleted, totalArchived] = await Promise.all([
      Match.countDocuments({
        $or: [{ founderId: userId }, { investorId: userId }],
        status: 'active'
      }),
      Match.countDocuments({
        $or: [{ founderId: userId }, { investorId: userId }],
        status: 'completed'
      }),
      Match.countDocuments({
        $or: [{ founderId: userId }, { investorId: userId }],
        status: 'archived'
      }),
    ]);

    // Get match trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const matchTrend = await Match.aggregate([
      {
        $match: {
          $or: [{ founderId: userId }, { investorId: userId }],
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        active: totalActive,
        completed: totalCompleted,
        archived: totalArchived,
        total: totalActive + totalCompleted + totalArchived,
        trend: matchTrend,
      },
    });
  } catch (error) {
    console.error('Get match stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match statistics',
    });
  }
};

// ============================================
// UPDATE MATCH STATUS
// PATCH /api/matches/:id/status
// ============================================

export const updateMatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (!['active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, completed, or archived',
      });
    }

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found',
      });
    }

    // Check if user is participant
    if (match.founderId.toString() !== userId.toString() && 
        match.investorId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this match',
      });
    }

    match.status = status;
    await match.save();

    // If match is completed, update deal room status
    if (status === 'completed') {
      await DealRoom.findByIdAndUpdate(match.dealRoomId, {
        status: 'closed',
        closedAt: new Date(),
      });
    }

    // Notify other party
    const otherUserId = match.founderId.toString() === userId.toString() 
      ? match.investorId 
      : match.founderId;

    await Notification.create({
      userId: otherUserId,
      type: 'match_updated',
      title: 'Match Status Updated',
      message: `Your match status has been updated to "${status}"`,
      data: {
        matchId: match._id,
        status,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Match status updated successfully',
      data: match,
    });
  } catch (error) {
    console.error('Update match status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update match status',
    });
  }
};

// ============================================
// GET MATCHES FOR FOUNDER
// GET /api/matches/founder/:founderId
// ============================================

export const getMatchesForFounder = async (req, res) => {
  try {
    const { founderId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if requesting user is the founder or admin
    if (req.user._id.toString() !== founderId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these matches',
      });
    }

    const query = { founderId };
    const matches = await Match.find(query)
      .populate('investorId', 'name email profilePicture')
      .populate('startupId', 'startupName logo sector')
      .populate('dealRoomId')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.status(200).json({
      success: true,
      count: matches.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: matches,
    });
  } catch (error) {
    console.error('Get matches for founder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
    });
  }
};

// ============================================
// GET MATCHES FOR INVESTOR
// GET /api/matches/investor/:investorId
// ============================================

export const getMatchesForInvestor = async (req, res) => {
  try {
    const { investorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Check if requesting user is the investor or admin
    if (req.user._id.toString() !== investorId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these matches',
      });
    }

    const query = { investorId };
    const matches = await Match.find(query)
      .populate('founderId', 'name email profilePicture')
      .populate('startupId', 'startupName logo sector')
      .populate('dealRoomId')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Match.countDocuments(query);

    res.status(200).json({
      success: true,
      count: matches.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: matches,
    });
  } catch (error) {
    console.error('Get matches for investor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getMyMatches,
  getMatchById,
  getMatchByDealRoom,
  getMatchStats,
  updateMatchStatus,
  getMatchesForFounder,
  getMatchesForInvestor,
};