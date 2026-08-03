import User from "../models/user.model.js";
import Startup from "../models/startup.model.js";
import Interest from "../models/interest.model.js";
import Match from "../models/match.model.js";
import DealRoom from "../models/dealRoom.model.js";
import Admin from "../models/admin.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service.js";

// ============================================
// GET PROFILE
// GET /api/users/profile
// ============================================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// ============================================
// UPDATE PROFILE
// PUT /api/users/profile
// ============================================

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Fields that can be updated
    const allowedFields = [
      "name",
      "bio",
      "location",
      "website",
      "linkedin",
      "twitter",
      "phoneNumber",
      "profilePicture",
      "investorProfile",
      "founderProfile",
    ];

    const filteredData = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      filteredData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e) => e.message).join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// ============================================
// CHANGE PASSWORD
// PATCH /api/users/password
// ============================================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password, new password, and confirm password",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send notification
    await Notification.create({
      userId: user._id,
      type: "password_changed",
      title: "🔐 Password Changed",
      message: "Your password was changed successfully. If this wasn't you, please contact support immediately.",
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

// ============================================
// UPLOAD PROFILE PICTURE
// POST /api/users/profile/picture
// ============================================

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.path, {
      folder: `profiles/${req.user._id}`,
      resource_type: "image",
      width: 400,
      height: 400,
      crop: "fill",
    });

    // Delete old profile picture if exists
    const user = await User.findById(req.user._id);
    if (user.profilePicture && user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }

    // Update user
    user.profilePicture = result.secure_url;
    user.profilePicturePublicId = result.public_id;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      data: {
        profilePicture: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
    });
  }
};

// ============================================
// GET ACCOUNT STATUS
// GET /api/users/status
// ============================================

export const getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("status verified role createdAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get additional stats
    const [startups, interests, matches, dealRooms] = await Promise.all([
      Startup.countDocuments({ ownerId: user._id }),
      Interest.countDocuments({
        $or: [{ senderId: user._id }, { receiverId: user._id }],
      }),
      Match.countDocuments({
        $or: [{ founderId: user._id }, { investorId: user._id }],
      }),
      DealRoom.countDocuments({
        "participants.userId": user._id,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        stats: {
          startups,
          interests,
          matches,
          dealRooms,
        },
      },
    });
  } catch (error) {
    console.error("Get account status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account status",
    });
  }
};

// ============================================
// DELETE ACCOUNT
// DELETE /api/users/account
// ============================================

export const deleteAccount = async (req, res) => {
  try {
    const { password, confirm } = req.body;

    if (!password || !confirm) {
      return res.status(400).json({
        success: false,
        message: "Please provide password and confirmation",
      });
    }

    if (confirm !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: 'Please type "DELETE" to confirm account deletion',
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // Delete all user data
    await Startup.deleteMany({ ownerId: user._id });
    await Interest.deleteMany({
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    });
    await Match.deleteMany({
      $or: [{ founderId: user._id }, { investorId: user._id }],
    });
    await DealRoom.deleteMany({
      "participants.userId": user._id,
    });
    await Admin.deleteOne({ userId: user._id });
    await Notification.deleteMany({ userId: user._id });

    // Delete profile picture from Cloudinary if exists
    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }

    // Delete user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
    });
  }
};

// ============================================
// GET USER BY ID
// GET /api/users/:id
// ============================================

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if requesting user has permission to view this profile
    // Only allow if they have a match or deal room together
    const isMatch = await Match.findOne({
      $or: [
        { founderId: req.user._id, investorId: id },
        { founderId: id, investorId: req.user._id },
      ],
    });

    const isDeal = await DealRoom.findOne({
      "participants.userId": { $all: [req.user._id, id] },
    });

    // If not a match or deal, return limited info
    if (!isMatch && !isDeal && req.user._id.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this profile",
      });
    }

    // Get user stats
    const [startups, interests, matches] = await Promise.all([
      Startup.countDocuments({ ownerId: user._id }),
      Interest.countDocuments({
        $or: [{ senderId: user._id }, { receiverId: user._id }],
      }),
      Match.countDocuments({
        $or: [{ founderId: user._id }, { investorId: user._id }],
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        stats: {
          startups: user.role === "founder" ? startups : undefined,
          interests,
          matches,
        },
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// ============================================
// GET PUBLIC PROFILE
// GET /api/users/public/:id
// ============================================

export const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("name bio location profilePicture role verified createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If founder, get their public startups
    let startups = [];
    if (user.role === "founder") {
      startups = await Startup.find({ ownerId: user._id, status: "published" })
        .select("startupName sector stage fundingTarget logo")
        .limit(5)
        .lean();
    }

    // If investor, get their public info
    let investorInfo = null;
    if (user.role === "investor" && user.investorProfile) {
      investorInfo = {
        entityType: user.investorProfile.entityType,
        investmentRange: user.investorProfile.investmentRange,
        industries: user.investorProfile.industries,
      };
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        startups: startups.length > 0 ? startups : undefined,
        investorInfo,
      },
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public profile",
    });
  }
};

// ============================================
// GET ALL INVESTORS
// GET /api/users/investors
// ============================================

export const getInvestors = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { role: "investor" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "investorProfile.firmName": { $regex: search, $options: "i" } },
      ];
    }

    const investors = await User.find(query)
      .select("name email profilePicture investorProfile verified createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: investors.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: investors,
    });
  } catch (error) {
    console.error("Get investors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch investors",
    });
  }
};

// ============================================
// GET ALL FOUNDERS
// GET /api/users/founders
// ============================================

export const getFounders = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { role: "founder" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const founders = await User.find(query)
      .select("name email profilePicture verified createdAt")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Get startup count for each founder
    const foundersWithStartups = await Promise.all(
      founders.map(async (founder) => {
        const startupCount = await Startup.countDocuments({
          ownerId: founder._id,
          status: "published",
        });
        return {
          ...founder,
          startupCount,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: foundersWithStartups.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: foundersWithStartups,
    });
  } catch (error) {
    console.error("Get founders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch founders",
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  getAccountStatus,
  deleteAccount,
  getUserById,
  getPublicProfile,
  getInvestors,
  getFounders,
};