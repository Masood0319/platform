import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: null,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: [6, "Password must be at least 6 characters"],
    select: false,
    default: null,
  },
  otp: {
    type: String,
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: null,
  },
  role: {
    type: String,
    enum: ["founder", "investor", "admin"],
    default: "founder",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "blocked", "pending"],
    default: "active",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationBadge: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  profilePicturePublicId: {
    type: String,
    default: null,
  },
  bio: {
    type: String,
    maxlength: [500, "Bio cannot exceed 500 characters"],
  },
  location: {
    type: String,
  },
  website: {
    type: String,
  },
  linkedin: {
    type: String,
  },
  twitter: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
    inApp: {
      type: Boolean,
      default: true,
    },
    interestUpdates: {
      type: Boolean,
      default: true,
    },
    matchUpdates: {
      type: Boolean,
      default: true,
    },
    dealUpdates: {
      type: Boolean,
      default: true,
    },
    messageNotifications: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: false,
    },
  },
  investorProfile: {
    entityType: {
      type: String,
      enum: ["angel", "vc", "family_office", "corporate_vc", "fund_of_funds"],
    },
    firmName: {
      type: String,
    },
    investmentRange: {
      min: Number,
      max: Number,
    },
    industries: [String],
    countries: [String],
    pastInvestments: [String],
    thesis: String,
  },
  founderProfile: {
    companyName: String,
    title: String,
    experience: String,
  },
  // Admin fields
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
  blockedAt: Date,
  blockedBy: mongoose.Schema.Types.ObjectId,
  blockReason: String,
}, {
  timestamps: true,
});

// Enforce unique email at the schema level for duplicate prevention.
userSchema.index({ email: 1 }, { unique: true, background: true });

// ============================================
// PRE-SAVE MIDDLEWARE - Hash password
// USING MONGOOSE 7+ STYLE (NO next() NEEDED)
// ============================================

userSchema.pre("save", async function() {
  // Only hash if password is modified or new
  if (!this.isModified("password")) return;

  const password = this.password;

  if (typeof password !== "string" || !password) return;

  // Skip re-hashing if the value is already a bcrypt hash
  const looksLikeBcryptHash = /^\$2[aby]\$\d{2}\$.{53}$/.test(password);
  if (looksLikeBcryptHash) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(password, salt);
});

// ============================================
// COMPARE PASSWORD METHOD
// ============================================

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ============================================
// TO JSON TRANSFORM
// ============================================

userSchema.set("toJSON", {
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;