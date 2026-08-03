// frontend/lib/services/interestService.js
import { apiRequest } from '@/lib/apiClient';

export async function expressInterest({ receiverId, receiverRole, senderRole, startupId, investorId }) {
  try {
    const response = await apiRequest('interests', {
      method: 'POST',
      data: {
        receiverId,
        receiverRole,
        senderRole,
        startupId,
        investorId,
      },
    });
    return response.data.interest;
  } catch (error) {
    console.error('Failed to express interest:', error);
    throw error;
  }
}

export async function getReceivedInterests() {
  try {
    const response = await apiRequest('interests/received');
    return response.data.interests || [];
  } catch (error) {
    console.error('Failed to fetch received interests:', error);
    return [];
  }
}

export async function getSentInterests() {
  try {
    const response = await apiRequest('interests/sent');
    return response.data.interests || [];
  } catch (error) {
    console.error('Failed to fetch sent interests:', error);
    return [];
  }
}

export async function acceptInterest(interestId) {
  try {
    const response = await apiRequest(`interests/${interestId}/accept`, {
      method: 'PATCH',
    });
    return response.data.interest;
  } catch (error) {
    console.error('Failed to accept interest:', error);
    throw error;
  }
}

export async function declineInterest(interestId) {
  try {
    const response = await apiRequest(`interests/${interestId}/decline`, {
      method: 'PATCH',
    });
    return response.data.interest;
  } catch (error) {
    console.error('Failed to decline interest:', error);
    throw error;
  }
}

export async function cancelInterest(interestId) {
  try {
    const response = await apiRequest(`interests/${interestId}`, {
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    console.error('Failed to cancel interest:', error);
    throw error;
  }
}
