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
        .select('conversation_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (partCheckError) throw partCheckError;

      if (!existingPart) {
        const { error: partInsertError } = await supabase
          .from(M2M_TABLE)
          .insert([{ conversation_id: conversationId, user_id: currentUserId }]);

        if (partInsertError) throw partInsertError;
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
        .eq('user_id', currentUserId);

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

  async getParticipantsForConversations(convIds) {
    if (!convIds.length) return [];

    const { data, error } = await supabase
      .from('chat_conversation_participants')
      .select('conversation_id, user_id')
      .in('conversation_id', convIds);

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
};