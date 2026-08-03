import Startup from "../models/startup.model.js";
import Interest from "../models/interest.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

// ============================================
// FOUNDER DASHBOARD
// GET /api/founder/dashboard
// ============================================

export const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all startups owned by the founder
    const startups = await Startup.find({ ownerId: userId });
    const startupIds = startups.map(s => s._id);

    // Get all deals (interests, matches, deal rooms)
    const [
      totalStartups,
      publishedStartups,
      totalInterests,
      pendingInterests,
      totalMatches,
      activeDeals,
      closedDeals,
      unreadNotifications,
      totalViews,
      totalInvestorInterests,
    ] = await Promise.all([
      Startup.countDocuments({ ownerId: userId }),
      Startup.countDocuments({ ownerId: userId, status: 'published' }),
      Interest.countDocuments({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }),
      Interest.countDocuments({
        receiverId: userId,
        status: 'pending'
      }),
      Match.countDocuments({
        $or: [{ founderId: userId }, { investorId: userId }],
        status: 'active'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: { $in: ['active', 'due_diligence'] }
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'closed'
      }),
      Notification.countDocuments({ userId, read: false }),
      Startup.aggregate([
        { $match: { ownerId: userId } },
        { $group: { _id: null, total: { $sum: '$viewCount' } } }
      ]),
      Interest.countDocuments({
        startupId: { $in: startupIds },
        status: 'pending'
      }),
    ]);

    // Get active deals with details
    const activeDealsData = await DealRoom.find({
      'participants.userId': userId,
      status: { $in: ['active', 'due_diligence'] }
    })
    .populate({
      path: 'matchId',
      populate: [
        { path: 'investorId', select: 'name email' },
        { path: 'startupId', select: 'startupName logo' }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

    // Get recent startup views (from analytics or log)
    // This would come from a separate analytics model if implemented

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStartups,
          publishedStartups,
          totalInterests,
          pendingInterests,
          totalMatches,
          activeDeals,
          closedDeals,
          unreadNotifications,
          totalViews: totalViews[0]?.total || 0,
          totalInvestorInterests,
        },
        activeDeals: activeDealsData.map(deal => ({
          id: deal._id,
          status: deal.status,
          investor: deal.matchId?.investorId || null,
          startup: deal.matchId?.startupId || null,
          updatedAt: deal.updatedAt,
          progress: getDealProgress(deal.status),
        })),
        recentStartups: startups.slice(0, 5).map(s => ({
          id: s._id,
          name: s.startupName,
          status: s.status,
          views: s.viewCount || 0,
          interests: s.interestCount || 0,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Founder dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    });
  }
};

// ============================================
// GET MY STARTUPS (with stats)
// GET /api/founder/startups
// ============================================

export const getMyStartups = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { ownerId: userId };
    if (status) query.status = status;

    const startups = await Startup.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Startup.countDocuments(query);

    // Get stats for each startup
    const startupsWithStats = await Promise.all(
      startups.map(async (startup) => {
        const [interestCount, matchCount, viewCount] = await Promise.all([
          Interest.countDocuments({ startupId: startup._id }),
          Match.countDocuments({ startupId: startup._id, status: 'active' }),
          // View count is stored in the startup model
        ]);

        return {
          ...startup,
          stats: {
            interestCount,
            matchCount,
            viewCount: startup.viewCount || 0,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: startupsWithStats.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: startupsWithStats,
    });
  } catch (error) {
    console.error('Get my startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your startups',
    });
  }
};

// ============================================
// GET STARTUP STATISTICS
// GET /api/founder/startups/stats
// ============================================

export const getStartupStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Startup.aggregate([
      { $match: { ownerId: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalInterests: { $sum: '$interestCount' },
        },
      },
    ]);

    const sectorDistribution = await Startup.aggregate([
      { $match: { ownerId: userId } },
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const stageDistribution = await Startup.aggregate([
      { $match: { ownerId: userId } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        bySector: sectorDistribution,
        byStage: stageDistribution,
        total: stats.reduce((acc, s) => acc + s.count, 0),
      },
    });
  } catch (error) {
    console.error('Startup stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startup statistics',
    });
  }
};

// ============================================
// GET DEAL STATISTICS
// GET /api/founder/deals/stats
// ============================================

export const getDealStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalInterests, totalMatches, totalDealRooms, closedDeals, activeDeals] = await Promise.all([
      Interest.countDocuments({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }),
      Match.countDocuments({
        $or: [{ founderId: userId }, { investorId: userId }]
      }),
      DealRoom.countDocuments({
        'participants.userId': userId
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'closed'
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: { $in: ['active', 'due_diligence'] }
      }),
    ]);

    // Get interest trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interestTrend = await Interest.aggregate([
      {
        $match: {
          $or: [
            { senderId: userId },
            { receiverId: userId }
          ],
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
        totalInterests,
        totalMatches,
        totalDealRooms,
        closedDeals,
        activeDeals,
        conversionRate: totalInterests > 0 ? (totalMatches / totalInterests) * 100 : 0,
        interestTrend,
      },
    });
  } catch (error) {
    console.error('Deal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal statistics',
    });
  }
};

// ============================================
// GET FOUNDER PROFILE
// GET /api/founder/profile
// ============================================

export const getFounderProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get additional founder data
    const [startups, totalInterests, totalMatches, totalDealRooms] = await Promise.all([
      Startup.find({ ownerId: userId }).select('startupName status createdAt').lean(),
      Interest.countDocuments({
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }),
      Match.countDocuments({
        $or: [{ founderId: userId }, { investorId: userId }]
      }),
      DealRoom.countDocuments({
        'participants.userId': userId
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        stats: {
          totalStartups: startups.length,
          totalInterests,
          totalMatches,
          totalDealRooms,
        },
        startups: startups.map(s => ({
          id: s._id,
          name: s.startupName,
          status: s.status,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get founder profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

// ============================================
// UPDATE FOUNDER PROFILE
// PUT /api/founder/profile
// ============================================

export const updateFounderProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Fields that can be updated
    const allowedFields = [
      'name',
      'bio',
      'location',
      'website',
      'linkedin',
      'twitter',
      'profilePicture',
      'phoneNumber',
    ];

    const filteredData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update founder profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// ============================================
// GET STARTUP INSIGHTS
// GET /api/founder/startups/:id/insights
// ============================================

export const getStartupInsights = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const startup = await Startup.findOne({ _id: id, ownerId: userId });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found or you do not own it',
      });
    }

    // Get detailed insights
    const [
      totalViews,
      uniqueViews,
      totalInterests,
      acceptedInterests,
      matches,
      dealRooms,
    ] = await Promise.all([
      // View count from startup model
      startup.viewCount || 0,
      // Unique views would need a separate analytics model
      0,
      Interest.countDocuments({ startupId: startup._id }),
      Interest.countDocuments({ startupId: startup._id, status: 'accepted' }),
      Match.countDocuments({ startupId: startup._id, status: 'active' }),
      DealRoom.countDocuments({
        matchId: { $in: await Match.find({ startupId: startup._id }).distinct('_id') }
      }),
    ]);

    // Get interest trend
    const interestTrend = await Interest.aggregate([
      {
        $match: {
          startupId: startup._id,
          createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) },
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

    // Get investor demographics (from interests)
    const investorDemographics = await Interest.aggregate([
      {
        $match: {
          startupId: startup._id,
          status: { $in: ['pending', 'accepted'] },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'investor',
        },
      },
      { $unwind: '$investor' },
      {
        $group: {
          _id: '$investor.investorProfile.entityType',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        startup: {
          id: startup._id,
          name: startup.startupName,
          status: startup.status,
        },
        metrics: {
          totalViews,
          uniqueViews,
          totalInterests,
          acceptedInterests,
          matches,
          dealRooms,
          conversionRate: totalInterests > 0 ? (matches / totalInterests) * 100 : 0,
        },
        trends: {
          interestTrend,
          investorDemographics,
        },
      },
    });
  } catch (error) {
    console.error('Startup insights error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startup insights',
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get deal progress percentage based on status
 */
const getDealProgress = (status) => {
  const progressMap = {
    'active': 25,
    'due_diligence': 50,
    'negotiation': 75,
    'closed': 100,
  };
  return progressMap[status] || 0;
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getDashboard,
  getMyStartups,
  getStartupStats,
  getDealStats,
  getFounderProfile,
  updateFounderProfile,
  getStartupInsights,
};