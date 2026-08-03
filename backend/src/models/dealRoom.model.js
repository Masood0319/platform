import mongoose from "mongoose";

const dealRoomSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['founder', 'investor'],
      required: true,
    },
  }],
  status: {
    type: String,
    enum: ['active', 'due_diligence', 'negotiation', 'closed', 'archived'],
    default: 'active',
  },
  amount: {
    type: Number,
    default: 0,
  },
  feeAmount: {
    type: Number,
    default: 0,
  },
  feePercentage: {
    type: Number,
    default: 3,
  },
  payoutStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
  payoutDate: {
    type: Date,
  },
  transactionId: {
    type: String,
  },
  payoutNotes: {
    type: String,
  },
  // Document storage
  documents: [{
    name: String,
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ['nda', 'term_sheet', 'due_diligence', 'other'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Activity log
  activityLog: [{
    action: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  // Admin fields
  closedAt: Date,
  closedBy: mongoose.Schema.Types.ObjectId,
  closedByAdmin: {
    type: Boolean,
    default: false,
  },
  disputeResolved: {
    type: Boolean,
    default: false,
  },
  disputeResolution: String,
  disputeResolvedBy: mongoose.Schema.Types.ObjectId,
  disputeResolvedAt: Date,
}, {
  timestamps: true,
});

// Indexes
dealRoomSchema.index({ matchId: 1 });
dealRoomSchema.index({ 'participants.userId': 1 });
dealRoomSchema.index({ status: 1 });

const DealRoom = mongoose.model('DealRoom', dealRoomSchema);

export default DealRoom;