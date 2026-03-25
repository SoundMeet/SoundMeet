import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../injectables/supaBaseClient';

export default function SoundmeetChat({ conversationId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_message')
        .select('id, content, timestamp, sender_id')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setIsLoading(false);
        return;
      }

      if (messagesData && messagesData.length > 0) {
        const senderIds = [...new Set(messagesData.map(m => m.sender_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('chat_profile')
          .select('user_id, display_name, pfp')
          .in('user_id', senderIds); 

        if (!profilesError && profilesData) {
          const completeMessages = messagesData.map(msg => {
            const profile = profilesData.find(p => p.user_id === msg.sender_id);
            return { ...msg, chat_profile: profile };
          });
          setMessages(completeMessages);
        } else {
          setMessages(messagesData);
        }
      } else {
        setMessages([]);
      }
      
      setIsLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_room_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_message',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          
          setMessages((prev) => {
            const existingMsg = prev.find(m => m.sender_id === newMsg.sender_id && m.chat_profile);
            if (existingMsg) {
              newMsg.chat_profile = existingMsg.chat_profile;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const textToSend = newMessage;
    setNewMessage(''); 

    const { error } = await supabase
      .from('chat_message')
      .insert([
        {
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: textToSend,
        },
      ]);

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(textToSend); 
    }
  };

  if (isLoading) return <div className="p-4 text-center text-black">Loading chat...</div>;

  return (
    <div className="flex flex-col h-125 max-h-screen w-full max-w-md border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden">
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-4">No messages yet. Start the jam!</p>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id) === String(currentUserId);
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && msg.chat_profile && (
                  <span className="text-xs text-gray-500 mb-1 ml-1">
                    {msg.chat_profile.display_name || 'Musician'}
                  </span>
                )}
                
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[80%] wrap-break-word ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form 
        onSubmit={handleSendMessage} 
        className="p-3 bg-white border-t border-gray-300 flex items-center gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 text-black py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}