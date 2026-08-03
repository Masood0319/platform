// frontend/lib/services/notificationService.js
import { apiRequest } from '@/lib/apiClient';

export async function getNotifications(page = 1, limit = 20) {
  try {
    const response = await apiRequest(`notifications?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return { notifications: [], pagination: {} };
  }
}

export async function markNotificationsAsRead(notificationIds) {
  try {
    const response = await apiRequest('notifications/read', {
      method: 'PUT',
      data: { notificationIds },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    throw error;
  }
}

export async function deleteNotifications(notificationIds) {
  try {
    const response = await apiRequest('notifications', {
      method: 'DELETE',
      data: { notificationIds },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    throw error;
  }
}