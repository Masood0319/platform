// frontend/lib/services/contactService.js
import { apiRequest } from '@/lib/apiClient';

export async function submitContactMessage({ name, email, subject, message, honeypot }) {
  const res = await apiRequest('contact', {
    method: 'POST',
    body: JSON.stringify({ name, email, subject, message, honeypot }),
  });
  return res;
}

// Admin-only
export async function getContactMessages({ page = 1, limit = 20, status } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);
  const res = await apiRequest(`admin/contact-messages?${params.toString()}`);
  return res;
}

export async function updateContactMessageStatus(id, status) {
  const res = await apiRequest(`admin/contact-messages/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data;
}