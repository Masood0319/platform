import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  dealRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DealRoom',
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ dealRoomId: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;