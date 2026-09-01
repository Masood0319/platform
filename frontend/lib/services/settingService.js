// frontend/lib/services/settingsService.js
import { apiRequest } from '@/lib/apiClient';

export async function getProfile() {
  const res = await apiRequest('users/profile');
  return res.data;
}

export async function updateNotificationPreferences(preferences) {
  const res = await apiRequest('users/profile', {
    method: 'PUT',
    body: JSON.stringify({ notificationPreferences: preferences }),
  });
  return res.data;
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const res = await apiRequest('users/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
  });
  return res;
}

export async function deleteAccount({ password, confirm }) {
  const res = await apiRequest('users/account', {
    method: 'DELETE',
    body: JSON.stringify({ password, confirm }),
  });
  return res;
}