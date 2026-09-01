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

// Propose (first call) or confirm (matching second call from the other
// participant) closing this deal at a given amount. The backend calculates
// the success fee itself - the amount is the only thing the client sends.
//
// Response shape differs by outcome:
//   - Still pending confirmation: response.data IS the deal room directly.
//   - Just finalized:            response.data = { dealRoom, amount, feeAmount, feePercentage }
// Callers should check `result.dealRoom` to tell which case they got.
export async function proposeOrConfirmClose(dealRoomId, amount) {
  const response = await apiRequest(`deal-rooms/${dealRoomId}/close`, {
    method: 'POST',
    data: { amount },
  });
  return response.data;
}

export async function updateChecklistItem(dealRoomId, item, completed) {
  const response = await apiRequest(`deal-rooms/${dealRoomId}/checklist`, {
    method: 'PATCH',
    data: { item, completed },
  });
  return response.data;
}