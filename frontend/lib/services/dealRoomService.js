import { apiRequest } from '@/lib/apiClient';

// BACKEND: All deal room routes are under /api/deal-rooms (hyphenated)
// Route config: backend/src/routes/dealRoom.routes.js
export async function getDealRooms() {
  const response = await apiRequest('deal-rooms', { method: 'GET' });
  return response.data?.dealRooms || response.data?.data?.dealRooms || [];
}

export async function getDealRoomById(dealRoomId) {
  const response = await apiRequest(`deal-rooms/${dealRoomId}`, { method: 'GET' });
  return response.data?.dealRoom || response.data?.data?.dealRoom;
}

export async function patchDealRoomStatus(dealRoomId, status) {
  const response = await apiRequest(`deal-rooms/${dealRoomId}/status`, {
    method: 'PATCH',
    data: { status },
  });
  return response.data?.dealRoom || response.data?.data?.dealRoom;
}
