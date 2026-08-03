import { apiRequest } from '@/lib/apiClient';

export async function getMatches() {
  const response = await apiRequest('matches', { method: 'GET' });
  return response.data?.matches || response.data?.data?.matches || [];
}

export async function getMatchById(matchId) {
  const response = await apiRequest(`matches/${matchId}`, { method: 'GET' });
  return response.data?.match || response.data?.data?.match;
}

