import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'interest_received',
      'interest_accepted',
      'interest_declined',
      'match_created',
      'deal_status_update',
      'verification_request',
      'verification_approved',
      'verification_rejected',
      'startup_created',
      'startup_published',
      'startup_approved',
      'startup_featured',
      'account_approved',
      'account_blocked',
      'password_changed',
      'new_message',
      'document_uploaded',
      'deal_closed',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;