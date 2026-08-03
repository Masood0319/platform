import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";
import Startup from "../models/startup.model.js";
import Interest from "../models/interest.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Verification from "../models/verification.model.js";
import Notification from "../models/notification.model.js";

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalFounders,
      totalInvestors,
      totalAdmins,
      totalStartups,
      publishedStartups,
      totalInterests,
      totalMatches,
      activeDeals,
      closedDeals,
      pendingVerifications,
      totalRevenue,
      newUsersToday,
      newStartupsThisWeek,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'founder' }),
      User.countDocuments({ role: 'investor' }),
      Admin.countDocuments(),
      Startup.countDocuments(),
      Startup.countDocuments({ status: 'published' }),
      Interest.countDocuments(),
      Match.countDocuments(),
      DealRoom.countDocuments({ status: { $in: ['active', 'due_diligence'] } }),
      DealRoom.countDocuments({ status: 'closed' }),
      Verification.countDocuments({ status: 'pending' }),
      DealRoom.aggregate([
        { $match: { status: 'closed' } },
        { $group: { _id: null, total: { $sum: '$feeAmount' } } }
      ]),
      User.countDocuments({ 
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      Startup.countDocuments({
        createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 7)) }
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          founders: totalFounders,
          investors: totalInvestors,
          admins: totalAdmins,
          newToday: newUsersToday,
        },
        startups: {
          total: totalStartups,
          published: publishedStartups,
          newThisWeek: newStartupsThisWeek,
        },
        deals: {
          totalInterests,
          totalMatches,
          active: activeDeals,
          closed: closedDeals,
        },
        verifications: {
          pending: pendingVerifications,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    });
  }
};

export const getPlatformAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
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
          founders: { 
            $sum: { $cond: [{ $eq: ['$role', 'founder'] }, 1, 0] }
          },
          investors: { 
            $sum: { $cond: [{ $eq: ['$role', 'investor'] }, 1, 0] }
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const dealActivity = await Interest.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          interests: { $sum: 1 },
          matches: {
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    const revenueData = await DealRoom.aggregate([
      {
        $match: {
          status: 'closed',
          closedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$closedAt' },
            month: { $month: '$closedAt' },
            day: { $dayOfMonth: '$closedAt' },
          },
          total: { $sum: '$feeAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        userGrowth,
        dealActivity,
        revenueData,
        period: days,
      },
    });
  } catch (error) {
    console.error('Platform analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
    });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, verified, status, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (verified !== undefined) query.verified = verified === 'true';
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const [startups, interests, matches, deals] = await Promise.all([
      Startup.countDocuments({ ownerId: user._id }),
      Interest.countDocuments({ 
        $or: [{ senderId: user._id }, { receiverId: user._id }]
      }),
      Match.countDocuments({
        $or: [{ founderId: user._id }, { investorId: user._id }]
      }),
      DealRoom.countDocuments({
        'participants.userId': user._id,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        stats: {
          startups,
          interests,
          matches,
          deals,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
};

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.status = 'active';
    user.approvedAt = new Date();
    user.approvedBy = req.user._id;
    await user.save();

    await Notification.create({
      userId: user._id,
      type: 'account_approved',
      title: '✅ Account Approved',
      message: 'Your account has been approved. You can now access all platform features.',
    });

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: user,
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user',
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.status = 'blocked';
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
    user.blockReason = reason || 'No reason provided';
    await user.save();

    await Notification.create({
      userId: user._id,
      type: 'account_blocked',
      title: '⛔ Account Blocked',
      message: `Your account has been blocked. Reason: ${user.blockReason}`,
    });

    res.status(200).json({
      success: true,
      message: 'User blocked successfully',
      data: user,
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block user',
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['founder', 'investor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be founder, investor, or admin',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (role === 'admin' && user.role !== 'admin') {
      await Admin.create({
        userId: user._id,
        role: 'admin',
        isActive: true,
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await Startup.deleteMany({ ownerId: user._id });
    await Interest.deleteMany({ 
      $or: [{ senderId: user._id }, { receiverId: user._id }]
    });
    await Match.deleteMany({
      $or: [{ founderId: user._id }, { investorId: user._id }]
    });
    await Admin.deleteOne({ userId: user._id });

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

// ============================================
// STARTUP MANAGEMENT
// ============================================

export const getAllStartups = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sector, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (sector) query.sector = sector;
    if (search) {
      query.$or = [
        { startupName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const startups = await Startup.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Startup.countDocuments(query);

    res.status(200).json({
      success: true,
      count: startups.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: startups,
    });
  } catch (error) {
    console.error('Get all startups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startups',
    });
  }
};

export const approveStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found',
      });
    }

    startup.isVerified = true;
    startup.approvedAt = new Date();
    startup.approvedBy = req.user._id;
    await startup.save();

    await Notification.create({
      userId: startup.ownerId,
      type: 'startup_approved',
      title: '✅ Startup Approved',
      message: `Your startup "${startup.startupName}" has been approved and is now visible to investors.`,
    });

    res.status(200).json({
      success: true,
      message: 'Startup approved successfully',
      data: startup,
    });
  } catch (error) {
    console.error('Approve startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve startup',
    });
  }
};

export const featureStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found',
      });
    }

    startup.featured = !startup.featured;
    await startup.save();

    res.status(200).json({
      success: true,
      message: `Startup ${startup.featured ? 'featured' : 'unfeatured'} successfully`,
      data: startup,
    });
  } catch (error) {
    console.error('Feature startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update startup feature status',
    });
  }
};

export const deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found',
      });
    }

    await startup.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Startup deleted successfully',
    });
  } catch (error) {
    console.error('Delete startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete startup',
    });
  }
};

// ============================================
// DEAL MANAGEMENT
// ============================================

export const getAllDeals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const deals = await DealRoom.find(query)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'founderId', select: 'name email' },
          { path: 'investorId', select: 'name email' },
          { path: 'startupId', select: 'startupName' },
        ],
      })
      .sort({ createdAt: -1 })
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
    console.error('Get all deals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deals',
    });
  }
};

export const getDealById = async (req, res) => {
  try {
    const deal = await DealRoom.findById(req.params.id)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'founderId', select: 'name email' },
          { path: 'investorId', select: 'name email' },
          { path: 'startupId', select: 'startupName' },
        ],
      })
      .lean();

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    res.status(200).json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error('Get deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal',
    });
  }
};

export const forceCloseDeal = async (req, res) => {
  try {
    const { amount, feeAmount } = req.body;
    const deal = await DealRoom.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    deal.status = 'closed';
    deal.closedAt = new Date();
    deal.closedBy = req.user._id;
    deal.closedByAdmin = true;
    deal.amount = amount || deal.amount || 0;
    deal.feeAmount = feeAmount || deal.feeAmount || (deal.amount * 0.03);
    await deal.save();

    res.status(200).json({
      success: true,
      message: 'Deal force closed successfully',
      data: deal,
    });
  } catch (error) {
    console.error('Force close deal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to force close deal',
    });
  }
};

export const resolveDispute = async (req, res) => {
  try {
    const { resolution, notes } = req.body;
    const deal = await DealRoom.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: 'Deal not found',
      });
    }

    deal.status = resolution === 'closed' ? 'closed' : 'active';
    deal.disputeResolved = true;
    deal.disputeResolution = notes || 'Resolved by admin';
    deal.disputeResolvedBy = req.user._id;
    deal.disputeResolvedAt = new Date();
    await deal.save();

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: deal,
    });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve dispute',
    });
  }
};

// ============================================
// VERIFICATION MANAGEMENT (ADMIN)
// ============================================

export const getVerificationRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const verifications = await Verification.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Verification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: verifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: verifications,
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification requests',
    });
  }
};

export const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const verification = await Verification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Verification is already approved',
      });
    }

    verification.status = 'approved';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    if (notes) {
      verification.adminNotes.push({
        note: notes,
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }
    await verification.save();

    await User.findByIdAndUpdate(verification.userId, {
      verified: true,
      verificationBadge: true,
    });

    await Notification.create({
      userId: verification.userId,
      type: 'verification_approved',
      title: '✅ Verification Approved!',
      message: 'Your account has been verified. You now have a verified badge!',
      data: { verificationId: verification._id },
    });

    res.status(200).json({
      success: true,
      message: 'Verification approved successfully',
      data: { userId: verification.userId, verified: true },
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification',
    });
  }
};

export const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection',
      });
    }

    const verification = await Verification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
    }

    if (verification.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Verification is already rejected',
      });
    }

    verification.status = 'rejected';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    verification.adminNotes.push({
      note: `Rejected: ${reason}`,
      addedBy: req.user._id,
      addedAt: new Date(),
    });
    await verification.save();

    await Notification.create({
      userId: verification.userId,
      type: 'verification_rejected',
      title: '❌ Verification Rejected',
      message: `Your verification request was rejected. Reason: ${reason}`,
      data: { verificationId: verification._id, reason },
    });

    res.status(200).json({
      success: true,
      message: 'Verification rejected',
      data: { userId: verification.userId, verified: false },
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification',
    });
  }
};

// ============================================
// REVENUE & PAYOUTS
// ============================================

export const getRevenueStats = async (req, res) => {
  try {
    const revenueData = await DealRoom.aggregate([
      { $match: { status: 'closed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$feeAmount' },
          totalDeals: { $sum: 1 },
          averageFee: { $avg: '$feeAmount' },
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyRevenue = await DealRoom.aggregate([
      { $match: { status: 'closed' } },
      {
        $group: {
          _id: {
            year: { $year: '$closedAt' },
            month: { $month: '$closedAt' },
          },
          total: { $sum: '$feeAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: revenueData[0] || {
          totalRevenue: 0,
          totalDeals: 0,
          averageFee: 0,
          totalAmount: 0,
        },
        monthly: monthlyRevenue,
      },
    });
  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue stats',
    });
  }
};

export const getPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { status: 'closed' };
    if (status) query.payoutStatus = status;

    const payouts = await DealRoom.find(query)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'founderId', select: 'name email' },
          { path: 'investorId', select: 'name email' },
        ],
      })
      .sort({ closedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await DealRoom.countDocuments(query);

    res.status(200).json({
      success: true,
      count: payouts.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: payouts,
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts',
    });
  }
};

export const markPayoutAsPaid = async (req, res) => {
  try {
    const { transactionId, notes } = req.body;
    const deal = await DealRoom.findById(req.params.id);

    if (!deal || deal.status !== 'closed') {
      return res.status(404).json({
        success: false,
        message: 'Deal not found or not closed',
      });
    }

    deal.payoutStatus = 'paid';
    deal.payoutDate = new Date();
    deal.transactionId = transactionId;
    deal.payoutNotes = notes;
    await deal.save();

    res.status(200).json({
      success: true,
      message: 'Payout marked as paid',
      data: deal,
    });
  } catch (error) {
    console.error('Mark payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid',
    });
  }
};

// ============================================
// PLATFORM SETTINGS
// ============================================

export const getPlatformSettings = async (req, res) => {
  try {
    const settings = {
      platformName: process.env.PLATFORM_NAME || 'Founder-Investor Platform',
      successFeePercentage: process.env.SUCCESS_FEE_PERCENTAGE || 3,
      maxUploadSize: process.env.MAX_UPLOAD_SIZE || '5MB',
      allowedCountries: (process.env.ALLOWED_COUNTRIES || 'UAE,KSA,Singapore').split(','),
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      features: {
        verificationRequired: process.env.VERIFICATION_REQUIRED === 'true',
        documentUpload: true,
        chatEnabled: true,
      },
    };

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
    });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const settings = req.body;
    // Save to database or environment
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
    });
  }
};

// ============================================
// ANALYTICS
// ============================================

export const getUserAnalytics = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verified: { 
            $sum: { $cond: [{ $eq: ['$verified', true] }, 1, 0] }
          },
        },
      },
    ]);

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byRole: userStats,
        growth: userGrowth,
        total: await User.countDocuments(),
        totalVerified: await User.countDocuments({ verified: true }),
      },
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analytics',
    });
  }
};

export const getDealAnalytics = async (req, res) => {
  try {
    const dealStats = await DealRoom.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFee: { $sum: '$feeAmount' },
        },
      },
    ]);

    const sectorStats = await Startup.aggregate([
      {
        $group: {
          _id: '$sector',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const dealTrend = await DealRoom.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: dealStats,
        bySector: sectorStats,
        trend: dealTrend,
        total: await DealRoom.countDocuments(),
        closed: await DealRoom.countDocuments({ status: 'closed' }),
        active: await DealRoom.countDocuments({ status: { $in: ['active', 'due_diligence'] } }),
      },
    });
  } catch (error) {
    console.error('Deal analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deal analytics',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getDashboardStats,
  getPlatformAnalytics,
  getAllUsers,
  getUserById,
  approveUser,
  blockUser,
  updateUserRole,
  deleteUser,
  getAllStartups,
  approveStartup,
  featureStartup,
  deleteStartup,
  getAllDeals,
  getDealById,
  forceCloseDeal,
  resolveDispute,
  getVerificationRequests,
  approveVerification,
  rejectVerification,
  getRevenueStats,
  getPayouts,
  markPayoutAsPaid,
  getPlatformSettings,
  updatePlatformSettings,
  getUserAnalytics,
  getDealAnalytics,
};