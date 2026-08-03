import User from "../models/user.model.js";
import Startup from "../models/startup.model.js";
import Interest from "../models/interest.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Notification from "../models/notification.model.js";

// ============================================
// GET ALL INVESTORS (Public)
// GET /api/investors
// ============================================

export const getAllInvestors = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sector, 
      country, 
      minCheck, 
      maxCheck,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = { role: 'investor' };

    // Filters
    if (sector) {
      query['investorProfile.industries'] = sector;
    }
    if (country) {
      query['investorProfile.countries'] = country;
    }
    if (minCheck || maxCheck) {
      query['investorProfile.investmentRange'] = {};
      if (minCheck) query['investorProfile.investmentRange.min'] = { $gte: parseInt(minCheck) };
      if (maxCheck) query['investorProfile.investmentRange.max'] = { $lte: parseInt(maxCheck) };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'investorProfile.firmName': { $regex: search, $options: 'i' } },
      ];
    }

    const investors = await User.find(query)
      .select('name email profilePicture investorProfile verified createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Get additional stats for each investor
    const investorsWithStats = await Promise.all(
      investors.map(async (investor) => {
        const [totalInterests, totalMatches, totalDeals] = await Promise.all([
          Interest.countDocuments({ investorId: investor._id }),
          Match.countDocuments({ investorId: investor._id, status: 'active' }),
          DealRoom.countDocuments({
            'participants.userId': investor._id,
            status: 'closed'
          }),
        ]);

        return {
          ...investor,
          stats: {
            totalInterests,
            totalMatches,
            totalDeals,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: investorsWithStats.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: investorsWithStats,
    });
  } catch (error) {
    console.error('Get all investors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investors',
    });
  }
};

// ============================================
// GET INVESTOR PROFILE
// GET /api/investors/:id
// ============================================

export const getInvestorProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('name email profilePicture investorProfile verified createdAt')
      .lean();

    if (!user || user.role !== 'investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found',
      });
    }

    // Get stats
    const [totalInterests, totalMatches, totalDeals] = await Promise.all([
      Interest.countDocuments({ investorId: user._id }),
      Match.countDocuments({ investorId: user._id, status: 'active' }),
      DealRoom.countDocuments({
        'participants.userId': user._id,
        status: 'closed'
      }),
    ]);

    // Check if current user has a match with this investor
    const hasMatch = req.user ? await Match.findOne({
      investorId: user._id,
      $or: [
        { founderId: req.user._id },
        { investorId: req.user._id }
      ]
    }) : null;

    res.status(200).json({
      success: true,
      data: {
        ...user,
        stats: {
          totalInterests,
          totalMatches,
          totalDeals,
        },
        hasMatch: !!hasMatch,
      },
    });
  } catch (error) {
    console.error('Get investor profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investor profile',
    });
  }
};

// ============================================
// GET INVESTOR STATS
// GET /api/investors/me/stats
// ============================================

export const getInvestorStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalInterests, pendingInterests, totalMatches, activeDeals, closedDeals, totalViews] = await Promise.all([
      Interest.countDocuments({ investorId: userId }),
      Interest.countDocuments({ investorId: userId, status: 'pending' }),
      Match.countDocuments({ investorId: userId, status: 'active' }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: { $in: ['active', 'due_diligence'] }
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'closed'
      }),
      // Views from startup views (for startups investor has shown interest in)
      Interest.aggregate([
        { $match: { investorId: userId } },
        { $lookup: { from: 'startups', localField: 'startupId', foreignField: '_id', as: 'startup' } },
        { $unwind: '$startup' },
        { $group: { _id: null, total: { $sum: '$startup.viewCount' } } }
      ]),
    ]);

    // Get interest trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const interestTrend = await Interest.aggregate([
      {
        $match: {
          investorId: userId,
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
        pendingInterests,
        totalMatches,
        activeDeals,
        closedDeals,
        totalViews: totalViews[0]?.total || 0,
        interestTrend,
        conversionRate: totalInterests > 0 ? (totalMatches / totalInterests) * 100 : 0,
      },
    });
  } catch (error) {
    console.error('Get investor stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investor statistics',
    });
  }
};

// ============================================
// GET MY PORTFOLIO (Investor only)
// GET /api/investors/me/portfolio
// ============================================

export const getMyPortfolio = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all closed deals
    const deals = await DealRoom.find({
      'participants.userId': userId,
      status: 'closed'
    })
    .populate({
      path: 'matchId',
      populate: [
        { path: 'startupId', select: 'startupName logo sector stage' },
        { path: 'founderId', select: 'name email' },
      ]
    })
    .sort({ closedAt: -1 })
    .lean();

    // Format portfolio data
    const portfolio = deals.map(deal => ({
      id: deal._id,
      startup: deal.matchId?.startupId || null,
      founder: deal.matchId?.founderId || null,
      amount: deal.amount || 0,
      feeAmount: deal.feeAmount || 0,
      closedAt: deal.closedAt,
      status: deal.status,
    }));

    // Get portfolio stats
    const totalInvested = portfolio.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = portfolio.reduce((sum, p) => sum + p.feeAmount, 0);
    const totalDeals = portfolio.length;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDeals,
          totalInvested,
          totalFees,
          averageInvestment: totalDeals > 0 ? totalInvested / totalDeals : 0,
        },
        deals: portfolio,
      },
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch portfolio',
    });
  }
};

// ============================================
// GET MY DEALS (Investor only)
// GET /api/investors/me/deals
// ============================================

export const getMyDeals = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      'participants.userId': userId,
    };
    if (status) query.status = status;

    const deals = await DealRoom.find(query)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'startupId', select: 'startupName logo sector stage fundingTarget' },
          { path: 'founderId', select: 'name email profilePicture' },
        ]
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await DealRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      count: deals.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: deals,
    });
  } catch (error) {
    console.error('Get my deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deals',
    });
  }
};

// ============================================
// GET INVESTOR DASHBOARD
// GET /api/investors/me/dashboard
// ============================================

export const getInvestorDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all stats
    const [
      totalInterests,
      pendingInterests,
      totalMatches,
      activeDeals,
      closedDeals,
      unreadNotifications,
      recommendedStartups,
    ] = await Promise.all([
      Interest.countDocuments({ investorId: userId }),
      Interest.countDocuments({ investorId: userId, status: 'pending' }),
      Match.countDocuments({ investorId: userId, status: 'active' }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: { $in: ['active', 'due_diligence'] }
      }),
      DealRoom.countDocuments({
        'participants.userId': userId,
        status: 'closed'
      }),
      Notification.countDocuments({ userId, read: false }),
      // Get recommended startups based on investor's preferences
      getRecommendedStartups(userId),
    ]);

    // Get active deals with details
    const activeDealsData = await DealRoom.find({
      'participants.userId': userId,
      status: { $in: ['active', 'due_diligence'] }
    })
    .populate({
      path: 'matchId',
      populate: [
        { path: 'startupId', select: 'startupName logo sector' },
        { path: 'founderId', select: 'name email' },
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(5)
    .lean();

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalInterests,
          pendingInterests,
          totalMatches,
          activeDeals,
          closedDeals,
          unreadNotifications,
        },
        recommendedStartups: recommendedStartups.slice(0, 5),
        activeDeals: activeDealsData,
      },
    });
  } catch (error) {
    console.error('Investor dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
    });
  }
};

// ============================================
// UPDATE INVESTOR PROFILE
// PUT /api/investors/me/profile
// ============================================

export const updateInvestorProfile = async (req, res) => {
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
      'phoneNumber',
      'profilePicture',
      'investorProfile',
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
    console.error('Update investor profile error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// ============================================
// HELPER: Get recommended startups for investor
// ============================================

const getRecommendedStartups = async (investorId) => {
  try {
    // Get investor preferences
    const investor = await User.findById(investorId).select('investorProfile');
    
    if (!investor?.investorProfile) {
      return [];
    }

    const { industries, investmentRange } = investor.investorProfile;

    // Build query based on investor preferences
    const query = {
      status: 'published',
    };

    if (industries && industries.length > 0) {
      query.sector = { $in: industries };
    }

    if (investmentRange?.min && investmentRange?.max) {
      query.fundingTarget = {
        $gte: investmentRange.min,
        $lte: investmentRange.max,
      };
    }

    // Get startups that investor hasn't already interacted with
    const interestedStartups = await Interest.find({ investorId }).distinct('startupId');

    if (interestedStartups.length > 0) {
      query._id = { $nin: interestedStartups };
    }

    const startups = await Startup.find(query)
      .populate('ownerId', 'name email')
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(10)
      .lean();

    return startups;
  } catch (error) {
    console.error('Get recommended startups error:', error);
    return [];
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getAllInvestors,
  getInvestorProfile,
  getInvestorStats,
  getMyPortfolio,
  getMyDeals,
  getInvestorDashboard,
  updateInvestorProfile,
};