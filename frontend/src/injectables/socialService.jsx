import { supabase } from './supaBaseClient';
import { apiFetch } from './Auth';
import { formatAvatarUrl } from '../utils/formatAvatarUrl';

export const socialService = {
  
  async getMyNotifications(userId, limit = 20, offset = 0) {
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data ?? [];
  },

  async deleteNotification(notificationId) {
    const { error } = await supabase
      .from('chat_notification')
      .delete()
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markNotificationAsRead(notificationId) {
    const { error } = await supabase
      .from('chat_notification')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  async getMyFriends(userId) {
    const { data, error } = await supabase
      .from('chat_profile')
      .select(`
        friends:chat_profile_friends (
          user:user_id (
            id,
            username,
            chat_profile ( display_name, pfp )
          )
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    return (data?.friends || [])
      .map(link => link.user)
      .filter(Boolean);
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
  },

  async getPeopleProfiles(currentUserId) {
    const { data, error } = await supabase
      .from('chat_profile')
      .select(`
        id,
        user_id,
        display_name,
        pfp,
        about,
        city,
        country,
        instruments_liked:chat_profile_instruments_liked (
          instrument:chat_instrument (id, name)
        ),
        genres_liked:chat_profile_genres_liked (
          genre:chat_genre (id, name)
        ),
        vibes_liked:chat_profile_vibes_liked (
          vibe:chat_vibe (id, name)
        )
      `)
      .neq('user_id', currentUserId)
      .order('display_name', { ascending: true })
      .limit(200);

    if (error) throw error;

    return (data ?? []).map((p) => ({
      id: p.user_id,
      profileId: p.id,
      displayName: p.display_name || '',
      username: '',
      avatarUrl: formatAvatarUrl(p.pfp),
      about: p.about || '',
      location: [p.city, p.country].filter(Boolean).join(', '),
      instruments: (p.instruments_liked || []).map((l) => l.instrument?.name).filter(Boolean),
      genres: (p.genres_liked || []).map((l) => l.genre?.name).filter(Boolean),
      vibes: (p.vibes_liked || []).map((l) => l.vibe?.name).filter(Boolean),
      isOnline: false,
      relationshipStatus: 'none',
    }));
  },
};