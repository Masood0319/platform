// frontend/lib/services/adminService.js
import { apiRequest } from '@/lib/apiClient';

// ============================================
// DASHBOARD
// ============================================

export async function getDashboardStats() {
  const res = await apiRequest('admin/dashboard');
  return res.data;
}

// ============================================
// USERS
// ============================================

export async function getUsers({ page = 1, limit = 20, role, status, search } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  if (search) params.set('search', search);
  const res = await apiRequest(`admin/users?${params.toString()}`);
  return res;
}

export async function approveUser(id) {
  const res = await apiRequest(`admin/users/${id}/approve`, { method: 'PATCH' });
  return res.data;
}

export async function blockUser(id, reason) {
  const res = await apiRequest(`admin/users/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

export async function deleteUser(id) {
  const res = await apiRequest(`admin/users/${id}`, { method: 'DELETE' });
  return res;
}

// ============================================
// VERIFICATIONS
// ============================================

export async function getVerificationRequests({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  const res = await apiRequest(`admin/verifications?${params.toString()}`);
  return res;
}

export async function approveVerification(id) {
  const res = await apiRequest(`admin/verifications/${id}/approve`, { method: 'PATCH' });
  return res.data;
}

export async function rejectVerification(id, reason) {
  const res = await apiRequest(`admin/verifications/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
  return res.data;
}

// ============================================
// DEALS
// ============================================

export async function getAllDeals({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  const res = await apiRequest(`admin/deals?${params.toString()}`);
  return res;
}

export async function forceCloseDeal(id) {
  const res = await apiRequest(`admin/deals/${id}/force-close`, { method: 'POST' });
  return res.data;
}

// ============================================
// PAYOUTS
// ============================================

export async function getPayouts({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  const res = await apiRequest(`admin/payouts?${params.toString()}`);
  return res;
}

export async function markPayoutAsPaid(id) {
  const res = await apiRequest(`admin/payouts/${id}/mark-paid`, { method: 'PATCH' });
  return res.data;
}