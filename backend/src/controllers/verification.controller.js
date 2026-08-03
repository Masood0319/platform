import Verification from "../models/verification.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/upload.service.js";

// ============================================
// SUBMIT VERIFICATION REQUEST
// POST /api/verification
// ============================================

export const submitVerification = async (req, res) => {
  try {
    const { type, idNumber, idType } = req.body;
    const userId = req.user._id;

    // Check if user already has a pending verification
    const existingVerification = await Verification.findOne({
      userId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingVerification) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${existingVerification.status} verification request`
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload verification documents'
      });
    }

    // Upload files to Cloudinary
    const documentUrls = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path, {
        folder: `verifications/${userId}`,
        resource_type: 'auto',
      });
      documentUrls.push({
        url: result.secure_url,
        publicId: result.public_id,
        type: file.fieldname || 'document',
      });
    }

    // Create verification request
    const verification = await Verification.create({
      userId,
      type: type || req.user.role, // 'founder' or 'investor'
      idNumber,
      idType: idType || 'passport',
      documents: documentUrls,
      status: 'pending',
      submittedAt: new Date(),
    });

    // Notify admin about new verification request
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: 'verification_request',
        title: 'New Verification Request',
        message: `${req.user.name} has submitted a verification request (${type || req.user.role})`,
        data: {
          verificationId: verification._id,
          userId: req.user._id,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully',
      data: {
        verificationId: verification._id,
        status: verification.status,
        submittedAt: verification.submittedAt,
      },
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================
// GET VERIFICATION STATUS
// GET /api/verification/status
// ============================================

export const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const verification = await Verification.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!verification) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'not_submitted',
          message: 'You have not submitted a verification request yet',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        status: verification.status,
        type: verification.type,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
        adminNotes: verification.adminNotes,
        message: verification.status === 'pending' 
          ? 'Your verification is being reviewed' 
          : verification.status === 'approved' 
          ? 'Your account is verified ✓' 
          : 'Your verification was rejected. Please resubmit.',
      },
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status',
    });
  }
};

// ============================================
// GET MY VERIFICATION REQUESTS
// GET /api/verification/my
// ============================================

export const getMyVerifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const verifications = await Verification.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: verifications.length,
      data: verifications,
    });
  } catch (error) {
    console.error('Get verifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verifications',
    });
  }
};

// ============================================
// GET VERIFICATION DOCUMENT
// GET /api/verification/:id/document
// ============================================

export const getVerificationDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const verification = await Verification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
    }

    // Check permissions: user can view their own docs, admins can view all
    if (verification.userId.toString() !== userId.toString() && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these documents',
      });
    }

    // Return document URLs
    res.status(200).json({
      success: true,
      data: {
        documents: verification.documents,
        type: verification.type,
        status: verification.status,
      },
    });
  } catch (error) {
    console.error('Get verification document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification documents',
    });
  }
};

// ============================================
// RESUBMIT VERIFICATION
// PUT /api/verification/:id/resubmit
// ============================================

export const resubmitVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { idNumber, idType } = req.body;

    const verification = await Verification.findOne({
      _id: id,
      userId,
      status: 'rejected',
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found or cannot be resubmitted',
      });
    }

    // Delete old documents from Cloudinary
    for (const doc of verification.documents) {
      if (doc.publicId) {
        await deleteFromCloudinary(doc.publicId);
      }
    }

    // Upload new documents
    const documentUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.path, {
          folder: `verifications/${userId}`,
          resource_type: 'auto',
        });
        documentUrls.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: file.fieldname || 'document',
        });
      }
    }

    // Update verification
    verification.documents = documentUrls;
    verification.idNumber = idNumber || verification.idNumber;
    verification.idType = idType || verification.idType;
    verification.status = 'pending';
    verification.adminNotes = [];
    verification.submittedAt = new Date();
    verification.reviewedAt = null;
    await verification.save();

    // Notify admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        type: 'verification_request',
        title: 'Verification Resubmitted',
        message: `${req.user.name} has resubmitted their verification request`,
        data: {
          verificationId: verification._id,
          userId: req.user._id,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification resubmitted successfully',
      data: {
        verificationId: verification._id,
        status: verification.status,
      },
    });
  } catch (error) {
    console.error('Resubmit verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resubmit verification',
    });
  }
};

// ============================================
// CANCEL VERIFICATION
// DELETE /api/verification/:id/cancel
// ============================================

export const cancelVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const verification = await Verification.findOne({
      _id: id,
      userId,
      status: 'pending',
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found or cannot be cancelled',
      });
    }

    // Delete documents from Cloudinary
    for (const doc of verification.documents) {
      if (doc.publicId) {
        await deleteFromCloudinary(doc.publicId);
      }
    }

    await verification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Verification cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel verification',
    });
  }
};

// ============================================
// ADMIN: GET ALL VERIFICATION REQUESTS
// GET /api/admin/verifications
// ============================================

export const getVerificationRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const verifications = await Verification.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Verification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: verifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: verifications,
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch verification requests',
    });
  }
};

// ============================================
// ADMIN: APPROVE VERIFICATION
// PATCH /api/admin/verifications/:id/approve
// ============================================

export const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const verification = await Verification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
    }

    if (verification.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Verification is already approved',
      });
    }

    // Update verification status
    verification.status = 'approved';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    if (notes) {
      verification.adminNotes.push({
        note: notes,
        addedBy: req.user._id,
        addedAt: new Date(),
      });
    }
    await verification.save();

    // Update user's verified status
    await User.findByIdAndUpdate(verification.userId, {
      verified: true,
      verificationBadge: true,
    });

    // Notify user
    await Notification.create({
      userId: verification.userId,
      type: 'verification_approved',
      title: '✅ Verification Approved!',
      message: 'Your account has been verified. You now have a verified badge!',
      data: {
        verificationId: verification._id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Verification approved successfully',
      data: {
        userId: verification.userId,
        verified: true,
      },
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve verification',
    });
  }
};

// ============================================
// ADMIN: REJECT VERIFICATION
// PATCH /api/admin/verifications/:id/reject
// ============================================

export const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection',
      });
    }

    const verification = await Verification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification not found',
      });
    }

    if (verification.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Verification is already rejected',
      });
    }

    // Update verification status
    verification.status = 'rejected';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    verification.adminNotes.push({
      note: `Rejected: ${reason}`,
      addedBy: req.user._id,
      addedAt: new Date(),
    });
    await verification.save();

    // Notify user
    await Notification.create({
      userId: verification.userId,
      type: 'verification_rejected',
      title: '❌ Verification Rejected',
      message: `Your verification request was rejected. Reason: ${reason}`,
      data: {
        verificationId: verification._id,
        reason,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Verification rejected',
      data: {
        userId: verification.userId,
        verified: false,
      },
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject verification',
    });
  }
};