import mongoose from "mongoose";

const interestSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true,
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
  },
  respondedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
interestSchema.index({ senderId: 1, receiverId: 1, startupId: 1 });
interestSchema.index({ startupId: 1, status: 1 });
interestSchema.index({ investorId: 1, status: 1 });

const Interest = mongoose.model('Interest', interestSchema);

export default Interest;