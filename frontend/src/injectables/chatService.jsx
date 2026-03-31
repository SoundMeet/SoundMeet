import { supabase } from '../injectables/supaBaseClient';

// NOTE: user_id in chat_conversation_participants must match the Django profile `id`
// field returned by GET /api/profiles/me/. If your backend stores the Django User PK
// (rather than Profile PK) in this column, change callers to use `user.user` instead.

export const chatService = {

  // ─── Conversation creation ────────────────────────────────────────────────

  async getOrCreateJamChat(jamId) {
    const { data: existingChat, error: fetchError } = await supabase
      .from('chat_conversation')
      .select('id')
      .eq('jam_id', jamId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existingChat) return existingChat.id;

    const { data: newChat, error: createError } = await supabase
      .from('chat_conversation')
      .insert([{ jam_id: jamId }])
      .select('id')
      .single();

    if (createError) throw createError;
    return newChat.id;
  },

  async getOrCreateDMChat(currentUserId, targetUserId) {
    const M2M_TABLE = 'chat_conversation_participants';

    const { data: myConversations, error: myConvError } = await supabase
      .from(M2M_TABLE)
      .select('conversation_id')
      .eq('user_id', currentUserId);

    if (myConvError) throw myConvError;

    const myConvIds = myConversations.map(c => c.conversation_id);

    if (myConvIds.length > 0) {
      const { data: sharedChat, error: sharedError } = await supabase
        .from(M2M_TABLE)
        .select('conversation_id')
        .in('conversation_id', myConvIds)
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

  // ─── Conversation listing ─────────────────────────────────────────────────

  // Returns all conversations the user participates in, with jam_id populated.
  async getUserConversations(userId) {
    const { data: participations, error: partError } = await supabase
      .from('chat_conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) throw partError;
    if (!participations?.length) return [];

    const convIds = participations.map(p => p.conversation_id);

    const { data: conversations, error: convError } = await supabase
      .from('chat_conversation')
      .select('id, jam_id')
      .in('id', convIds);

    if (convError) throw convError;
    return conversations ?? [];
  },

  // Returns all participant user_ids for a batch of conversation IDs.
  // Used to identify the "other" participant in DM conversations.
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

  // Fetch messages for a conversation, oldest first.
  // Assumes a `chat_message` table with columns:
  //   id, conversation_id, sender_id, content, message_type, created_at
  async getMessages(conversationId) {
    const { data, error } = await supabase
      .from('chat_message')
      .select('id, conversation_id, sender_id, content, message_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  // Insert a new message into a conversation.
  async sendMessage(conversationId, senderId, content, type = 'text') {
    const { data, error } = await supabase
      .from('chat_message')
      .insert([{
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: type,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to new messages in a conversation.
  // callback receives the raw Supabase row for each INSERT.
  // Returns an unsubscribe function — call it when the component unmounts.
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
