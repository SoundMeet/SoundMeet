import Navbar from '../components/Navbar'
import MeetCard from '../components/MeetCard'

import React, { useState } from 'react';
import SoundmeetChat from '../components/chat';

export default function Meet() {
  const CONVERSATION_ID = "84af80a8-b892-44fb-8c55-4873eae43cf8";
  const USER_A_ID = "1";
  const USER_B_ID = "2";

  const [activeUser, setActiveUser] = useState(USER_A_ID);

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans">
      <h1 className="text-2xl font-bold mb-6 text-black">Chat test</h1>
      
      <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <span className="font-medium text-gray-700">Currently:</span>
        <button 
          onClick={() => setActiveUser(USER_A_ID)}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeUser === USER_A_ID ? 'bg-blue-600 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          User A
        </button>
        <button 
          onClick={() => setActiveUser(USER_B_ID)}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeUser === USER_B_ID ? 'bg-green-600 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          User B
        </button>
      </div>

      <SoundmeetChat 
        conversationId={CONVERSATION_ID} 
        currentUserId={activeUser} 
      />
    </div>
  );
}