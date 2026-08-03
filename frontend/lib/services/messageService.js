// frontend/lib/services/messageService.js
import { apiRequest } from '@/lib/apiClient';

export async function getConversations() {
  try {
    const response = await apiRequest('conversations');
    return response.data.conversations || [];
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }
}

export async function getOrCreateConversation(partnerId) {
  try {
    const response = await apiRequest('conversations', {
      method: 'POST',
      data: { partnerId },
    });
    return response.data.conversation;
  } catch (error) {
    console.error('Failed to get or create conversation:', error);
    throw error;
  }
}

export async function getMessages(conversationId) {
  try {
    const response = await apiRequest(`messages/${conversationId}`);
    return response.data.messages || [];
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
}

export async function sendMessage(conversationId, text) {
  try {
    const response = await apiRequest('messages', {
      method: 'POST',
      data: { conversationId, text },
    });
    return response.data.message;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

export async function markMessagesAsRead(conversationId) {
  try {
    await apiRequest('messages/read', {
      method: 'PUT',
      data: { conversationId },
    });
  } catch (error) {
    console.error('Failed to mark messages as read:', error);
  }
}

export async function getUnreadCount() {
  try {
    const response = await apiRequest('messages/unread-count');
    return response.count || 0;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    return 0;
  }
}