import { supabase } from '../injectables/supaBaseClient';

// NOTE: user_id in chat_conversation_participants must match the Django profile `id`
// field returned by GET /api/profiles/me/. If your backend stores the Django User PK
// (rather than Profile PK) in this column, change callers to use `user.user` instead.

export const chatService = {

  // ─── Conversation creation ────────────────────────────────────────────────

  async getOrCreateJamChat(jamId, currentUserId) {
    const M2M_TABLE = 'chat_conversation_participants';

    let conversationId;
    const { data: existingChat, error: fetchError } = await supabase
      .from('chat_conversation')
      .select('id')
      .eq('jam_id', jamId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingChat) {
      conversationId = existingChat.id;
    } else {
      const { data: newChat, error: createError } = await supabase
        .from('chat_conversation')
        .insert([{ jam_id: jamId }])
        .select('id')
        .single();

      if (createError) throw createError;
      conversationId = newChat.id;
    }

    if (currentUserId) {
      const { data: existingPart, error: partCheckError } = await supabase
        .from(M2M_TABLE)
        .select('conversation_id, left_at')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (partCheckError) throw partCheckError;

      if (!existingPart) {
        // First time joining — insert row
        const { error: partInsertError } = await supabase
          .from(M2M_TABLE)
          .insert([{ conversation_id: conversationId, user_id: currentUserId }]);

        if (partInsertError) throw partInsertError;
      } else if (existingPart.left_at) {
        // User previously left this chat (e.g. via leaveJamChat) — clear left_at to rejoin
        const { error: rejoinErr } = await supabase
          .from(M2M_TABLE)
          .update({ left_at: null })
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId);
        if (rejoinErr) throw rejoinErr;
      }
    }

    return conversationId;
  },

  /**
   * Delete the jam conversation (and all its messages via DB cascade).
   * Safe to call after jam deletion — non-fatal if no conversation exists.
   */
  async deleteJamConversation(jamId) {
    const { error } = await supabase
      .from('chat_conversation')
      .delete()
      .eq('jam_id', Number(jamId));
    if (error) throw error;
  },

  async getUsersProfiles(userIds) {
    if (!userIds || userIds.length === 0) return [];

    const { data, error } = await supabase
      .from('chat_profile') 
      .select('user_id, display_name, pfp')
      .in('user_id', userIds);

    if (error) throw error;
    return data ?? [];
  },

  async getOrCreateDMChat(currentUserId, targetUserId) {
    const M2M_TABLE = 'chat_conversation_participants';

    const { data: myDms, error: myConvError } = await supabase
      .from('chat_conversation')
      .select(`
        id,
        chat_conversation_participants!inner(user_id)
      `)
      .is('jam_id', null) 
      .eq('chat_conversation_participants.user_id', currentUserId);

    if (myConvError) throw myConvError;

    const myDmConvIds = myDms.map(c => c.id);

    if (myDmConvIds.length > 0) {
      const { data: sharedChat, error: sharedError } = await supabase
        .from(M2M_TABLE)
        .select('conversation_id')
        .in('conversation_id', myDmConvIds)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (sharedError) throw sharedError;

      if (sharedChat) {
        return sharedChat.conversation_id;
      }
    }

    const { data: newConversation, error: createError } = await supabase
      .from('chat_conversation')
      .insert([{ jam_id: null }])
      .select('id')
      .single();

    if (createError) throw createError;

    const { error: participantsError } = await supabase
      .from(M2M_TABLE)
      .insert([
        { conversation_id: newConversation.id, user_id: currentUserId },
        { conversation_id: newConversation.id, user_id: targetUserId }
      ]);

    if (participantsError) throw participantsError;

    return newConversation.id;
  },

  async getUserConversations(currentUserId) {
      const M2M_TABLE = 'chat_conversation_participants';

      const { data: participations, error: fetchError } = await supabase
        .from(M2M_TABLE)
        .select('conversation_id')
        .eq('user_id', currentUserId)
        .is('left_at', null);

      if (fetchError) throw fetchError;

      if (!participations || participations.length === 0) {
        return [];
      }

      const conversationIds = participations.map(p => p.conversation_id);

      const { data: conversations, error: convError } = await supabase
        .from('chat_conversation')
        .select(`
          id,
          jam_id,
          chat_conversation_participants (
            user_id
          )
        `)
        .in('id', conversationIds);

      if (convError) throw convError;

      return conversations;
    },

  // ─── Conversation listing ─────────────────────────────────────────────────

  /**
   * Fetch the latest message for each conversation in one query.
   * Returns a map of { [convId: string]: { sender_id, content, timestamp } }.
   */
  async getLastMessagesForConversations(convIds) {
    if (!convIds.length) return {};

    // Fetch recent messages ordered newest-first, then pick first per conv in JS.
    // Limit is generous but bounded: 10 candidates per conversation.
    const { data, error } = await supabase
      .from('chat_message')
      .select('id, conversation_id, sender_id, content, timestamp')
      .in('conversation_id', convIds)
      .order('timestamp', { ascending: false })
      .limit(Math.min(convIds.length * 10, 500));

    if (error) throw error;

    const latest = {};
    for (const row of (data ?? [])) {
      const cid = String(row.conversation_id);
      if (!latest[cid]) latest[cid] = row;
    }
    return latest;
  },

  async getParticipantsForConversations(convIds) {
    if (!convIds.length) return [];

    const { data, error } = await supabase
      .from('chat_conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds)
      .is('left_at', null);

    if (error) throw error;
    return data ?? [];
  },

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('chat_message')
      .select('id, conversation_id, sender_id, content, timestamp, is_read')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async sendMessage(conversationId, senderId, content) {
    const { data, error } = await supabase
      .from('chat_message')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        content
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  subscribeToMessages(conversationId, callback) {
    const channel = supabase
      .channel(`chat_msgs_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  // ─── Chat membership ──────────────────────────────────────────────────────

  /**
   * Returns { conversationId, leftAt } for a jam + user without auto-joining.
   * Returns null if no conversation exists for the jam yet.
   */
  async getJamChatStatus(jamId, userId) {
    const { data: conv, error: convErr } = await supabase
      .from('chat_conversation')
      .select('id')
      .eq('jam_id', Number(jamId))
      .maybeSingle();
    if (convErr) throw convErr;
    if (!conv?.id) return null;

    const { data: part, error: partErr } = await supabase
      .from('chat_conversation_participants')
      .select('left_at')
      .eq('conversation_id', conv.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (partErr) throw partErr;

    return { conversationId: conv.id, leftAt: part?.left_at ?? null };
  },

  /**
   * Returns the current user's participant row for a conversation.
   * { left_at } — null means active, non-null means they left.
   */
  async getJamChatMembership(conversationId, userId) {
    const { data, error } = await supabase
      .from('chat_conversation_participants')
      .select('left_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },

  /**
   * Leave a jam chat without leaving the jam.
   * Sets left_at — does not remove attendance.
   * Inserts a system event message so the chat shows "[Name] left the chat".
   */
  async leaveJamChat(conversationId, userId) {
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .is('left_at', null);
    if (error) throw error;

    // System event — non-fatal if it fails
    await supabase
      .from('chat_message')
      .insert([{ conversation_id: conversationId, sender_id: userId, content: '__system:left_chat__' }])
      .catch(() => {});
  },

  /**
   * Rejoin a jam chat the user previously left.
   * Clears left_at — only valid while jam is upcoming or live (enforced by caller).
   */
  async rejoinJamChat(conversationId, userId) {
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({ left_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /**
   * Hide a DM conversation for the current user only.
   * Sets left_at on their participant row — the other person is unaffected.
   */
  async hideDMConversation(conversationId, userId) {
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({ left_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .is('left_at', null);
    if (error) throw error;
  },

  /**
   * Resurface a previously hidden DM (e.g. on incoming message).
   * Clears left_at for that user only.
   */
  async unhideDMConversation(conversationId, userId) {
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({ left_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};