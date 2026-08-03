import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin',
  },
  permissions: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  loginHistory: [{
    ip: String,
    userAgent: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  activityLog: [{
    action: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['user', 'startup', 'deal', 'verification', 'settings', 'other'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;