import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';

export const socialService = {
  
  async getMyNotifications(userId) {
    const { data, error } = await supabase
      .from('chat_notification')
      .select(`
        id,
        notification_type,
        message,
        reference_id,
        metadata,
        is_read,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async markNotificationAsRead(notificationId) {
    const { error } = await supabase
      .from('chat_notification')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },


  async getPendingFriendRequests(userId) {
    const { data, error } = await supabase
      .from('chat_friendrequest')
      .select(`
        id,
        status,
        created_at,
        from_user:from_user_id (
          id,
          username,
          chat_profile ( display_name, pfp )
        )
      `)
      .eq('to_user_id', userId)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async sendFriendRequest(targetUserId) {
    return await apiFetch('api/friends/request/', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId }),
    });
  },

  async handleFriendRequest(requestId, action) {
    return await apiFetch(`api/friends/request/${requestId}/handle/`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }
};