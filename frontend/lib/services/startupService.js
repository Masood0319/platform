// frontend/lib/services/startupService.js
import { apiRequest } from '@/lib/apiClient';

export async function getStartups() {
  try {
    const response = await apiRequest('startups');
    // Backend returns { success, count, total, page, pages, data: [...] }
    // so response.data is already the array
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch startups:', error);
    return [];
  }
}

export async function getStartupById(id) {
  try {
    const response = await apiRequest(`startups/${id}`);
    // Backend returns { success, data: { ...startup } }
    // so response.data is the startup object directly
    return response.data;
  } catch (error) {
    console.error('Failed to fetch startup:', error);
    return null;
  }
}

export async function createStartup(data) {
  try {
    const response = await apiRequest('startups', {
      method: 'POST',
      data,
    });
    // Backend currently returns { success, message, data: startup }
    return response.data?.startup || response.data;
  } catch (error) {
    console.error('Failed to create startup:', error);
    throw error;
  }
}

// --- Metadata ---------------------------------------------------------

export async function getStartupMeta() {
  try {
    const response = await apiRequest('startups/meta');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch startup metadata:', error);
    return null;
  }
}

// --- Update / publish ---------------------------------------------------

export async function updateStartup(id, data) {
  try {
    const response = await apiRequest(`startups/${id}`, {
      method: 'PUT',
      data,
    });
    return response.data?.startup || response.data;
  } catch (error) {
    console.error('Failed to update startup:', error);
    throw error;
  }
}

export async function setStartupPublishStatus(id, status) {
  try {
    const response = await apiRequest(`startups/${id}/publish`, {
      method: 'PATCH',
      data: { status },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to update startup status:', error);
    throw error;
  }
}

// --- File uploads (real multipart, not blob URLs) -----------------------

async function uploadStartupFile(path, file) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const form = new FormData();
  form.append('document', file);

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    throw new Error(json.message || 'Upload failed');
  }

  return json.data;
}

export function uploadStartupLogo(id, file) {
  return uploadStartupFile(`startups/${id}/image?type=logo`, file);
}

export function uploadStartupCoverImage(id, file) {
  return uploadStartupFile(`startups/${id}/image?type=cover`, file);
}

export function uploadStartupPitchDeck(id, file) {
  return uploadStartupFile(`startups/${id}/pitch-deck`, file);
}