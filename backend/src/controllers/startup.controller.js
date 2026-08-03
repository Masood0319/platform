import Startup, {
  STARTUP_SECTORS,
  STARTUP_STAGES,
  STARTUP_COUNTRIES,
  STARTUP_CURRENCIES,
  STARTUP_TRACTION_LEVELS,
  REQUIRED_FOR_PUBLISH,
} from "../models/startup.model.js";
import User from "../models/user.model.js";
import Interest from "../models/interest.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Notification from "../models/notification.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service.js";

// ============================================
// Shared helpers
// ============================================

// Human-readable labels for the canonical enum values. Kept here (not in the
// model) because labels are a presentation concern; the model only owns the
// values that are actually valid data.
const SECTOR_LABELS = {
  fintech: 'Fintech', healthtech: 'HealthTech', ecommerce: 'E-commerce',
  saas: 'SaaS', 'ai-ml': 'AI / ML', edtech: 'EdTech', climatetech: 'ClimateTech',
  logistics: 'Logistics', realestate: 'Real Estate', cybersecurity: 'Cybersecurity',
  agritech: 'AgriTech', other: 'Other',
};

const STAGE_LABELS = {
  'pre-seed': 'Pre-seed', seed: 'Seed', 'series-a': 'Series A',
  'series-b': 'Series B', 'series-c': 'Series C+',
};

const COUNTRY_LABELS = {
  uae: 'United Arab Emirates', ksa: 'Saudi Arabia', singapore: 'Singapore',
  egypt: 'Egypt', pakistan: 'Pakistan', india: 'India', malaysia: 'Malaysia', other: 'Other',
};

const CURRENCY_LABELS = { USD: 'USD ($)', EUR: 'EUR (€)', GBP: 'GBP (£)' };

const TRACTION_LABELS = {
  'pre-revenue': 'Pre-revenue',
  'less-than-10k': 'Under $10k MRR',
  '10k-50k': '$10k – $50k MRR',
  '50k-100k': '$50k – $100k MRR',
  'greater-than-100k': 'Over $100k MRR',
};

const toOptions = (values, labels) => values.map((value) => ({ value, label: labels[value] || value }));

// Fields a founder is allowed to set directly, on both create and update.
// Anything not in this list (isVerified, featured, viewCount, publishedAt,
// approvedAt, approvedBy, status, ownerId, slug) is server-controlled only —
// this closes the mass-assignment gap that previously existed on create.
const WRITABLE_FIELDS = [
  'startupName', 'tagline', 'description', 'sector', 'stage',
  'fundingTarget', 'fundingRaised', 'currency', 'traction',
  'monthlyRevenue', 'customersCount', 'growthNotes',
  'registrationCountry', 'city', 'website', 'linkedin',
  'logo', 'coverImage', 'pitchDeck', 'videoUrl',
  'teamSize', 'foundedDate', 'uniqueValue', 'fundUsage',
];

function pickWritableFields(body) {
  const data = {};
  WRITABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  return data;
}

// Returns the list of REQUIRED_FOR_PUBLISH fields that are missing/empty on
// a given startup-like object. Used identically by createStartup (when
// publishing immediately) and publishStartup, so the rule can never drift
// between the two entry points.
function getPublishBlockers(startup) {
  const blockers = REQUIRED_FOR_PUBLISH
    .filter((field) => startup[field] === undefined || startup[field] === null || startup[field] === '')
    .map((field) => `${field} is required`);

  if (startup.fundingTarget !== undefined && startup.fundingTarget !== null) {
    if (startup.fundingTarget < 10000) blockers.push('Funding target must be at least 10,000');
    if (startup.fundingTarget > 10000000) blockers.push('Funding target cannot exceed 10,000,000');
  }

  return blockers;
}

// ============================================
// GET ALL STARTUPS (Public)
// GET /api/startups
// ============================================

export const getAllStartups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sector,
      stage,
      country,
      minAmount,
      maxAmount,
      traction,
      search,
      sort = '-createdAt'
    } = req.query;

    const query = { status: 'published' };

    // Filters
    if (sector) query.sector = sector;
    if (stage) query.stage = stage;
    if (country) query.registrationCountry = country;
    if (traction) query.traction = traction;
    if (search) {
      query.$or = [
        { startupName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tagline: { $regex: search, $options: 'i' } },
      ];
    }
    if (minAmount || maxAmount) {
      query.fundingTarget = {};
      if (minAmount) query.fundingTarget.$gte = parseInt(minAmount);
      if (maxAmount) query.fundingTarget.$lte = parseInt(maxAmount);
    }

    // Sort options
    const sortOptions = {
      '-createdAt': { createdAt: -1 },
      'createdAt': { createdAt: 1 },
      '-fundingTarget': { fundingTarget: -1 },
      'fundingTarget': { fundingTarget: 1 },
      '-viewCount': { viewCount: -1 },
    };

    const sortQuery = sortOptions[sort] || sortOptions['-createdAt'];

    const startups = await Startup.find(query)
      .populate('ownerId', 'name email verified')
      .sort(sortQuery)
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

// ============================================
// GET STARTUP STATS (Public)
// GET /api/startups/stats
// ============================================

export const getStartupStats = async (req, res) => {
  try {
    const [total, bySector, byStage, byCountry] = await Promise.all([
      Startup.countDocuments({ status: 'published' }),
      Startup.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$sector', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Startup.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      Startup.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$registrationCountry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        bySector,
        byStage,
        byCountry,
      },
    });
  } catch (error) {
    console.error('Get startup stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startup statistics',
    });
  }
};

// ============================================
// GET STARTUP METADATA (Public)
// GET /api/startups/meta
// Canonical value/label pairs for every enum field on the Startup model.
// This is the single source of truth the frontend selectors read from —
// prevents "SaaS is not a valid enum"-style drift permanently.
// ============================================

export const getStartupMeta = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      sectors: toOptions(STARTUP_SECTORS, SECTOR_LABELS),
      stages: toOptions(STARTUP_STAGES, STAGE_LABELS),
      countries: toOptions(STARTUP_COUNTRIES, COUNTRY_LABELS),
      currencies: toOptions(STARTUP_CURRENCIES, CURRENCY_LABELS),
      traction: toOptions(STARTUP_TRACTION_LEVELS, TRACTION_LABELS),
      requiredForPublish: REQUIRED_FOR_PUBLISH,
    },
  });
};

// ============================================
// GET MY STARTUPS (Founder only)
// GET /api/startups/mine
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
        const [interestCount, matchCount] = await Promise.all([
          Interest.countDocuments({ startupId: startup._id }),
          Match.countDocuments({ startupId: startup._id, status: 'active' }),
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
// GET STARTUP BY ID
// GET /api/startups/:id
// ============================================

export const getStartupById = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id)
      .populate('ownerId', 'name email verified')
      .lean();

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found',
      });
    }

    // Check if user is authorized to view full details
    const isOwner = req.user && startup.ownerId._id.toString() === req.user._id.toString();
    const isInvestor = req.user && req.user.role === 'investor';

    // If not owner or investor, return limited info
    if (!isOwner && !isInvestor && req.user?.role !== 'admin') {
      // Remove sensitive fields
      const { ownerId, ...limitedData } = startup;
      return res.status(200).json({
        success: true,
        data: limitedData,
      });
    }

    // Increment view count
    if (!isOwner) {
      await Startup.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    }

    res.status(200).json({
      success: true,
      data: startup,
    });
  } catch (error) {
    console.error('Get startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startup',
    });
  }
};

// ============================================
// GET STARTUP BY SLUG
// GET /api/startups/slug/:slug
// ============================================

export const getStartupBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const startup = await Startup.findOne({
      slug: slug,
      status: 'published'
    }).populate('ownerId', 'name email verified').lean();

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found',
      });
    }

    res.status(200).json({
      success: true,
      data: startup,
    });
  } catch (error) {
    console.error('Get startup by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch startup',
    });
  }
};

// ============================================
// CREATE STARTUP (Founder only)
// POST /api/startups
// Body may represent either a draft (partial data) or a publish request
// (publish: true / status: 'published'). Drafts skip completeness checks;
// publish requests are validated against REQUIRED_FOR_PUBLISH server-side
// regardless of what the client believes it already validated.
// ============================================

export const createStartup = async (req, res) => {
  try {
    const userId = req.user._id;

    const shouldPublish = req.body?.publish === true || req.body?.status === 'published';

    const startupData = pickWritableFields(req.body);
    startupData.ownerId = userId;
    startupData.status = shouldPublish ? 'published' : 'draft';

    if (shouldPublish) {
      const missing = getPublishBlockers(startupData);
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot publish — missing required fields: ${missing.join(', ')}`,
          missingFields: missing,
        });
      }
      startupData.publishedAt = new Date();
    }

    const startup = await Startup.create(startupData);

    // Create notification
    await Notification.create({
      userId: userId,
      type: 'startup_created',
      title: '🚀 Startup Created',
      message: `Your startup "${startup.startupName}" has been created. Complete your profile and publish to get investor attention.`,
      data: {
        startupId: startup._id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Startup created successfully',
      data: startup,
    });
  } catch (error) {
    console.error('Create startup error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create startup',
    });
  }
};

// ============================================
// UPDATE STARTUP (Founder only)
// PUT /api/startups/:id
// Used for both draft autosave and pre-publish edits — no completeness
// check here, since a draft update should never be forced to be "whole."
// ============================================

export const updateStartup = async (req, res) => {
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

    const updateData = pickWritableFields(req.body);

    const updatedStartup = await Startup.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Startup updated successfully',
      data: updatedStartup,
    });
  } catch (error) {
    console.error('Update startup error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map(e => e.message).join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update startup',
    });
  }
};

// ============================================
// DELETE STARTUP (Founder only)
// DELETE /api/startups/:id
// ============================================

export const deleteStartup = async (req, res) => {
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

    // Check if startup has active interests
    const hasActiveInterests = await Interest.findOne({
      startupId: startup._id,
      status: { $in: ['pending', 'accepted'] },
    });

    if (hasActiveInterests) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete startup with active interests. Please decline all interests first.',
      });
    }

    // Soft delete - set status to 'archived'
    startup.status = 'archived';
    await startup.save();

    res.status(200).json({
      success: true,
      message: 'Startup archived successfully',
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
// PUBLISH STARTUP (Founder only)
// PATCH /api/startups/:id/publish
// The authoritative completeness gate — never trust that the frontend
// already validated. Runs the exact same REQUIRED_FOR_PUBLISH check as
// createStartup so the rule can't drift between entry points.
// ============================================

export const publishStartup = async (req, res) => {
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

    const newStatus = req.body.status || (startup.status === 'published' ? 'draft' : 'published');

    if (newStatus === 'published') {
      const missing = getPublishBlockers(startup);
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot publish — missing required fields: ${missing.join(', ')}`,
          missingFields: missing,
        });
      }
    }

    startup.status = newStatus;

    if (newStatus === 'published' && !startup.publishedAt) {
      startup.publishedAt = new Date();
    }

    await startup.save();

    if (newStatus === 'published') {
      await Notification.create({
        userId: userId,
        type: 'startup_published',
        title: '🎉 Startup Published!',
        message: `Your startup "${startup.startupName}" is now live and visible to investors.`,
        data: {
          startupId: startup._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Startup ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`,
      data: { status: newStatus },
    });
  } catch (error) {
    console.error('Publish startup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update startup status',
    });
  }
};

// ============================================
// UPLOAD PITCH DECK (Founder only)
// POST /api/startups/:id/pitch-deck
// ============================================

export const uploadPitchDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a pitch deck file (PDF)',
      });
    }

    const startup = await Startup.findOne({ _id: id, ownerId: userId });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found or you do not own it',
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      folder: `pitch-decks/${userId}`,
      resource_type: 'auto',
    });

    // Delete old pitch deck if exists
    if (startup.pitchDeckPublicId) {
      await deleteFromCloudinary(startup.pitchDeckPublicId);
    }

    startup.pitchDeck = result.secure_url;
    startup.pitchDeckPublicId = result.public_id;
    await startup.save();

    res.status(200).json({
      success: true,
      message: 'Pitch deck uploaded successfully',
      data: {
        pitchDeck: result.secure_url,
      },
    });
  } catch (error) {
    console.error('Upload pitch deck error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload pitch deck',
    });
  }
};

// ============================================
// UPLOAD STARTUP IMAGE (Founder only)
// POST /api/startups/:id/image
// ============================================

export const uploadStartupImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { type = 'logo' } = req.query;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image',
      });
    }

    const startup = await Startup.findOne({ _id: id, ownerId: userId });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: 'Startup not found or you do not own it',
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      folder: `startups/${userId}`,
      resource_type: 'image',
      width: type === 'logo' ? 300 : 1200,
      height: type === 'logo' ? 300 : 600,
      crop: 'fill',
    });

    // Update appropriate field
    if (type === 'logo') {
      if (startup.logoPublicId) {
        await deleteFromCloudinary(startup.logoPublicId);
      }
      startup.logo = result.secure_url;
      startup.logoPublicId = result.public_id;
    } else if (type === 'cover') {
      if (startup.coverImagePublicId) {
        await deleteFromCloudinary(startup.coverImagePublicId);
      }
      startup.coverImage = result.secure_url;
      startup.coverImagePublicId = result.public_id;
    }

    await startup.save();

    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        type,
      },
    });
  } catch (error) {
    console.error('Upload startup image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getAllStartups,
  getStartupStats,
  getStartupMeta,
  getMyStartups,
  getStartupById,
  getStartupBySlug,
  createStartup,
  updateStartup,
  deleteStartup,
  publishStartup,
  uploadPitchDeck,
  uploadStartupImage,
};