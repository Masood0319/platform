import mongoose from "mongoose";

const dealRoomSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match",
    required: true,
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["founder", "investor"],
      required: true,
    },
  }],
  status: {
    type: String,
    enum: ["interested", "nda_signed", "due_diligence", "closed", "declined"],
    default: "interested",
  },
  amount: {
    type: Number,
    default: 0,
  },
  // Dual confirmation for closing
  closeProposal: {
    amount: Number,
    proposedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    proposedAt: Date,
    founderConfirmed: {
      type: Boolean,
      default: false,
    },
    investorConfirmed: {
      type: Boolean,
      default: false,
    },
    founderConfirmedAt: Date,
    investorConfirmedAt: Date,
  },
  feePercentage: {
    type: Number,
    default: 3,
  },
  feeAmount: {
    type: Number,
    default: 0,
  },
  payoutStatus: {
    type: String,
    enum: ["pending", "invoiced", "paid"],
    default: "pending",
  },
  payoutDate: Date,
  transactionId: String,
  payoutNotes: String,
  // Documents
  documents: [{
    name: String,
    url: String,
    publicId: String,
    type: {
      type: String,
      enum: ["nda", "term_sheet", "due_diligence", "other"],
    },
    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Shared due diligence checklist
  dueDiligenceChecklist: {
    financials: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      completedAt: { type: Date, default: null },
    },
    capTable: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      completedAt: { type: Date, default: null },
    },
    legalDocuments: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      completedAt: { type: Date, default: null },
    },
    teamBackgrounds: {
      completed: { type: Boolean, default: false },
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      completedAt: { type: Date, default: null },
    },
  },
  activityLog: [{
    action: String,
    description: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
dealRoomSchema.index({ "participants.userId": 1 });
dealRoomSchema.index({ status: 1 });

const DealRoom = mongoose.model("DealRoom", dealRoomSchema);

export default DealRoom;