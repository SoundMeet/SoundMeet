import { supabase } from '../injectables/supaBaseClient';

export const chatService = {
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
  }
};