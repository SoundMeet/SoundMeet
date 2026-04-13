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
      .select(`
        user_id, display_name, pfp,
        instruments_liked:chat_profile_instruments_liked (
          instrument:chat_instrument (name)
        )
      `)
      .in('user_id', userIds);

    if (error) throw error;

    return (data ?? []).map((p) => ({
      ...p,
      mainInstrument: p.instruments_liked?.[0]?.instrument?.name ?? null,
    }));
  },

  async getOrCreateDMChat(currentUserId, targetUserId) {
    const M2M_TABLE = 'chat_conversation_participants';

    // Step 1: Fetch ALL participant rows for current user — including hidden ones
    // (left_at IS NOT NULL). We must not filter left_at here so we can find and
    // restore hidden conversations instead of creating duplicates.
    const { data: myParticipations, error: myPartError } = await supabase
      .from(M2M_TABLE)
      .select('conversation_id, left_at')
      .eq('user_id', currentUserId);

    if (myPartError) throw myPartError;

    const myConvIds = (myParticipations ?? []).map(p => p.conversation_id);

    if (myConvIds.length > 0) {
      // Step 2: Among those conversations, keep only true DMs (all group FKs are null).
      const { data: dmConvs, error: dmErr } = await supabase
        .from('chat_conversation')
        .select('id')
        .in('id', myConvIds)
        .is('jam_id', null)
        .is('band_id', null)
        .is('show_id', null);

      if (dmErr) throw dmErr;

      const dmConvIds = (dmConvs ?? []).map(c => c.id);

      if (dmConvIds.length > 0) {
        // Step 3: Check if target user is a participant in any of those DMs.
        // Use .limit(1) — NOT .maybeSingle() — so duplicate rows don't throw.
        const { data: sharedParts, error: sharedErr } = await supabase
          .from(M2M_TABLE)
          .select('conversation_id')
          .in('conversation_id', dmConvIds)
          .eq('user_id', targetUserId)
          .limit(1);

        if (sharedErr) throw sharedErr;

        if (sharedParts && sharedParts.length > 0) {
          const convId = sharedParts[0].conversation_id;

          // Step 4: Restore the conversation for current user if it was hidden.
          // This is the canonical "get or restore" — never create a duplicate.
          const myRow = myParticipations.find(p => p.conversation_id === convId);
          if (myRow?.left_at) {
            const { error: restoreErr } = await supabase
              .from(M2M_TABLE)
              .update({ left_at: null })
              .eq('conversation_id', convId)
              .eq('user_id', currentUserId);
            if (restoreErr) throw restoreErr;
          }

          return convId;
        }
      }
    }

    // No existing DM found — create a canonical new one.
    const { data: newConversation, error: createError } = await supabase
      .from('chat_conversation')
      .insert([{}])
      .select('id')
      .single();

    if (createError) throw createError;

    const { error: participantsError } = await supabase
      .from(M2M_TABLE)
      .insert([
        { conversation_id: newConversation.id, user_id: currentUserId },
        { conversation_id: newConversation.id, user_id: targetUserId },
      ]);

    if (participantsError) throw participantsError;

    return newConversation.id;
  },

  async getUserConversations(currentUserId) {
    const M2M_TABLE = 'chat_conversation_participants';

    // Fetch active participant rows including unread state for this user.
    const { data: participations, error: fetchError } = await supabase
      .from(M2M_TABLE)
      .select('conversation_id, unread_count, last_read_message_id')
      .eq('user_id', currentUserId)
      .is('left_at', null);

    if (fetchError) throw fetchError;

    if (!participations || participations.length === 0) {
      return [];
    }

    const conversationIds = participations.map(p => p.conversation_id);

    // Build a fast lookup: convId → { unread_count, last_read_message_id }
    const unreadByConvId = {}
    for (const p of participations) {
      unreadByConvId[String(p.conversation_id)] = {
        unreadCount:       p.unread_count ?? 0,
        lastReadMessageId: p.last_read_message_id ?? null,
      }
    }

    // Fetch conversations ordered by most recent message, null-last.
    const { data: conversations, error: convError } = await supabase
      .from('chat_conversation')
      .select(`
        id,
        jam_id,
        last_message_at,
        last_message_id,
        chat_conversation_participants (
          user_id
        )
      `)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convError) throw convError;

    // Attach unread state to each conversation row so callers have it in one place.
    return (conversations ?? []).map(c => ({
      ...c,
      ...unreadByConvId[String(c.id)],
    }));
  },

  // ─── Conversation listing ─────────────────────────────────────────────────

  /**
   * Fetch the latest message for each conversation using the last_message_id
   * pointer already maintained by the DB trigger on chat_conversation.
   * One PK lookup per conversation — no cap, always correct.
   *
   * @param {Array<{ id, last_message_id }>} conversations
   *   The array returned by getUserConversations (includes last_message_id).
   * @returns {Object} Map of { [convId: string]: message row }
   */
  async getLastMessagesForConversations(conversations) {
    if (!conversations.length) return {};

    const messageIds = conversations.map(c => c.last_message_id).filter(Boolean);
    if (!messageIds.length) return {};

    const { data, error } = await supabase
      .from('chat_message')
      .select('id, conversation_id, sender_id, content, timestamp')
      .in('id', messageIds);

    if (error) throw error;

    return Object.fromEntries(
      (data ?? []).map(row => [String(row.conversation_id), row])
    );
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
    try {
      await supabase
        .from('chat_message')
        .insert([{ conversation_id: conversationId, sender_id: userId, content: '__system:left_chat__' }]);
    } catch (_) {}
  },

  /**
   * Rejoin a jam chat the user previously left.
   * Clears left_at — only valid while jam is upcoming or live (enforced by caller).
   * Recomputes unread_count for messages that arrived while left_at was set.
   */
  async rejoinJamChat(conversationId, userId) {
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({ left_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw error;

    await supabase.rpc('recompute_unread', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    }).then(({ error: rpcErr }) => {
      if (rpcErr) console.error('[chatService] recompute_unread after rejoin failed:', rpcErr);
    });
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
   * Recomputes unread_count for messages that arrived while left_at was set.
   */
  async unhideDMConversation(conversationId, userId) {
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({ left_at: null })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw error;

    await supabase.rpc('recompute_unread', {
      p_conversation_id: conversationId,
      p_user_id: userId,
    }).then(({ error: rpcErr }) => {
      if (rpcErr) console.error('[chatService] recompute_unread after DM restore failed:', rpcErr);
    });
  },

  // ─── Read state ──────────────────────────────────────────────────────────

  /**
   * Mark a conversation as read for the current user.
   * Sets unread_count = 0, advances last_read_message_id (primary pointer)
   * and last_read_at (secondary metadata).
   */
  async markConversationRead(conversationId, userId, latestMessageId) {
    if (!latestMessageId) return;
    const { error } = await supabase
      .from('chat_conversation_participants')
      .update({
        unread_count:        0,
        last_read_message_id: latestMessageId,
        last_read_at:        new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);
    if (error) throw error;
  },
};