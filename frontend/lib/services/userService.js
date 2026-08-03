// frontend/lib/services/userService.js
import { apiRequest } from '@/lib/apiClient';

export async function getCurrentUser() {
  try {
    const response = await apiRequest('auth/me');
    return response.data.user;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

export async function updateUser(data) {
  try {
    const response = await apiRequest('users/profile', {
      method: 'PUT',
      data,
    });
    return response.data.user;
  } catch (error) {
    console.error('Failed to update user:', error);
    throw error;
  }
}

export async function login(credentials) {
  try {
    const response = await apiRequest('auth/login', {
      method: 'POST',
      data: credentials,
    });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

export async function register(userData) {
  try {
    // BACKEND: POST /api/auth/signup — matches backend auth route
    const response = await apiRequest('auth/signup', {
      method: 'POST',
      data: userData,
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export async function getInvestors(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.industry) queryParams.append('industry', filters.industry);
    if (filters.investmentRange) queryParams.append('investmentRange', filters.investmentRange);

    const queryString = queryParams.toString();
    const url = `users/investors${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(url);
    // Backend returns { success, count, total, page, pages, data: [...] }
    // so response.data is already the array
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch investors:', error);
    return [];
  }
}

export async function getFounders(filters = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.industry) queryParams.append('industry', filters.industry);
    if (filters.stage) queryParams.append('stage', filters.stage);

    const queryString = queryParams.toString();
    const url = `users/founders${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(url);
    return response.data.founders || [];
  } catch (error) {
    console.error('Failed to fetch founders:', error);
    return [];
  }
}
