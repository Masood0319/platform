import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";

// ============================================
// GET NOTIFICATIONS
// GET /api/notifications
// ============================================

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

// ============================================
// GET UNREAD COUNT
// GET /api/notifications/unread
// ============================================

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
    });
  }
};

// ============================================
// MARK NOTIFICATIONS AS READ
// PUT /api/notifications/read
// ============================================

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { ids } = req.body;

    let query = { userId, read: false };
    
    if (ids && Array.isArray(ids) && ids.length > 0) {
      query._id = { $in: ids };
    }

    const result = await Notification.updateMany(query, {
      read: true,
      readAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read',
      data: {
        markedCount: result.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
    });
  }
};

// ============================================
// MARK ALL AS READ
// PUT /api/notifications/read-all
// ============================================

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, read: false },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        markedCount: result.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
    });
  }
};

// ============================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
    });
  }
};

// ============================================
// DELETE MULTIPLE NOTIFICATIONS
// DELETE /api/notifications
// ============================================

export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide notification IDs to delete',
      });
    }

    const result = await Notification.deleteMany({
      _id: { $in: ids },
      userId,
    });

    res.status(200).json({
      success: true,
      message: 'Notifications deleted successfully',
      data: {
        deletedCount: result.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notifications',
    });
  }
};

// ============================================
// DELETE ALL NOTIFICATIONS
// DELETE /api/notifications/all
// ============================================

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'All notifications deleted successfully',
      data: {
        deletedCount: result.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all notifications',
    });
  }
};

// ============================================
// GET NOTIFICATION PREFERENCES
// GET /api/notifications/preferences
// ============================================

export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('notificationPreferences');
    
    const defaultPreferences = {
      email: true,
      push: true,
      inApp: true,
      interestUpdates: true,
      matchUpdates: true,
      dealUpdates: true,
      messageNotifications: true,
      marketingEmails: false,
    };

    const preferences = user?.notificationPreferences || defaultPreferences;

    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
    });
  }
};

// ============================================
// UPDATE NOTIFICATION PREFERENCES
// PUT /api/notifications/preferences
// ============================================

export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;

    const allowedFields = [
      'email',
      'push',
      'inApp',
      'interestUpdates',
      'matchUpdates',
      'dealUpdates',
      'messageNotifications',
      'marketingEmails',
    ];

    const filteredPreferences = {};
    allowedFields.forEach(field => {
      if (preferences[field] !== undefined) {
        filteredPreferences[field] = preferences[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationPreferences: filteredPreferences },
      { new: true, runValidators: true }
    ).select('notificationPreferences');

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
    });
  }
};

// ============================================
// GET NOTIFICATION BY ID
// GET /api/notifications/:id
// ============================================

export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: id,
      userId,
    }).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Mark as read if not already
    if (!notification.read) {
      await Notification.findByIdAndUpdate(id, {
        read: true,
        readAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
    });
  }
};

// ============================================
// GET NOTIFICATIONS BY TYPE
// GET /api/notifications/type/:type
// ============================================

export const getNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({
      userId,
      type,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments({
      userId,
      type,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: notifications,
    });
  } catch (error) {
    console.error('Get notifications by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
    });
  }
};

// ============================================
// MARK NOTIFICATIONS AS READ (Multiple types)
// PUT /api/notifications/read/types
// ============================================

export const markNotificationsByTypeAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { types } = req.body;

    if (!types || !Array.isArray(types) || types.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide notification types',
      });
    }

    const result = await Notification.updateMany(
      {
        userId,
        type: { $in: types },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read',
      data: {
        markedCount: result.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error('Mark notifications by type as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read',
    });
  }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteNotifications,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationById,
  getNotificationsByType,
  markNotificationsByTypeAsRead,
};