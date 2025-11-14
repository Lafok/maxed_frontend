import { useState } from 'react';
import ChatList from '../components/ChatList';
import MessageArea from '../components/MessageArea';

const ChatPage = () => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  return (
    <div className="h-screen flex">
      <ChatList
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
      />
      <MessageArea
        activeChatId={activeChatId}
      />
    </div>
  );
};

export default ChatPage;
