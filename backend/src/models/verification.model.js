import mongoose from "mongoose";

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  type: {
    type: String,
    enum: ['founder', 'investor'],
    required: [true, 'Verification type is required'],
  },
  idNumber: {
    type: String,
    trim: true,
  },
  idType: {
    type: String,
    enum: ['passport', 'national_id', 'drivers_license', 'company_registration'],
    default: 'passport',
  },
  documents: [{
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    type: {
      type: String,
      enum: ['id_front', 'id_back', 'selfie', 'company_registration', 'other'],
      default: 'other',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  adminNotes: [{
    note: {
      type: String,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for performance
verificationSchema.index({ userId: 1, status: 1 });
verificationSchema.index({ status: 1, submittedAt: -1 });
verificationSchema.index({ type: 1, status: 1 });

// Virtual: isExpired
verificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save middleware
verificationSchema.pre('save', function(next) {
  // If status is changed to 'approved', set reviewedAt
  if (this.isModified('status') && this.status === 'approved' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  next();
});

// Static method to get pending count
verificationSchema.statics.getPendingCount = function() {
  return this.countDocuments({ status: 'pending' });
};

// Static method to get verification stats
verificationSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

const Verification = mongoose.model('Verification', verificationSchema);

export default Verification;