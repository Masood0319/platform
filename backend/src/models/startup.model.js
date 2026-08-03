import mongoose from "mongoose";

export const STARTUP_SECTORS = [
  'fintech', 'healthtech', 'ecommerce', 'saas', 'ai-ml',
  'edtech', 'climatetech', 'logistics', 'realestate',
  'cybersecurity', 'agritech', 'other'
];

export const STARTUP_STAGES = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c'];

export const STARTUP_COUNTRIES = [
  'uae', 'ksa', 'singapore', 'egypt', 'pakistan', 'india', 'malaysia', 'other'
];

export const STARTUP_CURRENCIES = ['USD', 'EUR', 'GBP'];

export const STARTUP_TRACTION_LEVELS = [
  'pre-revenue', 'less-than-10k', '10k-50k', '50k-100k', 'greater-than-100k'
];

// Fields required to move a startup from draft -> published.
// Kept as a named export so the controller's publish-gate and any future
// admin/reporting tooling reference the exact same list — single source of truth.
export const REQUIRED_FOR_PUBLISH = [
  'startupName', 'description', 'sector', 'stage', 'fundingTarget', 'registrationCountry'
];

const startupSchema = new mongoose.Schema({
  startupName: {
    type: String,
    required: [true, 'Startup name is required'],
    trim: true,
    maxlength: [100, 'Startup name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  tagline: {
    type: String,
    trim: true,
    maxlength: [200, 'Tagline cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
    // NOTE: intentionally not `required` at the schema level anymore.
    // A draft may exist with only a name. Completeness for *publishing*
    // is enforced in the controller (see REQUIRED_FOR_PUBLISH), not here.
    // This is what makes real drafts possible — see audit §7.
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner ID is required']
  },
  sector: {
    type: String,
    enum: { values: STARTUP_SECTORS, message: '{VALUE} is not a valid sector' }
  },
  stage: {
    type: String,
    enum: { values: STARTUP_STAGES, message: '{VALUE} is not a valid stage' },
    default: 'pre-seed'
  },
  fundingTarget: {
    type: Number
    // NOTE: minimum enforced at publish-time in the controller
    // (getPublishBlockers), not at the schema level — allows draft
    // startups to save incomplete funding targets.
  },
  fundingRaised: {
    type: Number,
    default: 0,
    min: [0, 'Funding raised cannot be negative']
  },
  currency: {
    type: String,
    enum: { values: STARTUP_CURRENCIES, message: '{VALUE} is not a supported currency' },
    default: 'USD'
  },
  traction: {
    type: String,
    enum: STARTUP_TRACTION_LEVELS,
    default: 'pre-revenue'
  },
  monthlyRevenue: {
    type: Number,
    min: [0, 'Monthly revenue cannot be negative']
  },
  customersCount: {
    type: Number,
    min: [0, 'Customer count cannot be negative']
  },
  growthNotes: {
    type: String,
    maxlength: [1000, 'Growth notes cannot exceed 1000 characters']
  },
  registrationCountry: {
    type: String,
    enum: { values: STARTUP_COUNTRIES, message: '{VALUE} is not a valid registration country' }
  },
  city: {
    type: String,
    trim: true,
    maxlength: [100, 'City cannot exceed 100 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/i, 'Website must be a valid URL starting with http:// or https://']
  },
  linkedin: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/i, 'LinkedIn must be a valid URL starting with http:// or https://']
  },
  logo: { type: String, default: null },
  logoPublicId: { type: String, default: null },
  coverImage: { type: String, default: null },
  coverImagePublicId: { type: String, default: null },
  pitchDeck: { type: String, default: null },
  pitchDeckPublicId: { type: String, default: null },
  videoUrl: {
    type: String,
    trim: true
  },
  teamSize: {
    type: Number,
    min: [1, 'Team size must be at least 1']
  },
  foundedDate: {
    type: Date
  },
  uniqueValue: {
    type: String,
    maxlength: [1000, 'Unique value proposition cannot exceed 1000 characters']
  },
  fundUsage: {
    type: String,
    maxlength: [1000, 'Fund usage cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  interestCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date,
    default: null
  },
  // Admin fields
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
startupSchema.index({ ownerId: 1, status: 1 });
startupSchema.index({ sector: 1, stage: 1 });
startupSchema.index({ registrationCountry: 1 });
startupSchema.index({ status: 1, publishedAt: -1 });

// Auto-generate a URL-safe slug from the name; re-generate if the name changes.
// Uses the document's own ObjectId suffix to guarantee uniqueness without a
// separate counter collection.
startupSchema.pre('validate', function () {
  if (!this.slug || this.isModified('startupName')) {
    const base = (this.startupName || 'startup')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    this.slug = `${base || 'startup'}-${this._id.toString().slice(-6)}`;
  }

  if (this.isModified('monthlyRevenue') && this.monthlyRevenue != null) {
    const r = this.monthlyRevenue;
    this.traction =
      r <= 0 ? 'pre-revenue' :
      r < 10000 ? 'less-than-10k' :
      r < 50000 ? '10k-50k' :
      r < 100000 ? '50k-100k' :
      'greater-than-100k';
  }
});

const Startup = mongoose.model('Startup', startupSchema);

export default Startup;