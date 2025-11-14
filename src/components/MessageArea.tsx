interface MessageAreaProps {
  activeChatId: string | null;
}

const MessageArea = ({ activeChatId }: MessageAreaProps) => {
  // In a real app, you would fetch chat details based on activeChatId
  // For now, we just display the ID or a placeholder message.

  return (
    <div className="flex-grow flex flex-col bg-white">
      <div className="flex items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">
          {activeChatId ? `Chat with User` : 'Select a chat'}
        </h2>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {/* Messages will go here */}
        {!activeChatId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a chat from the sidebar to start messaging.</p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-200">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={!activeChatId}
        />
      </div>
    </div>
  );
};

export default MessageArea;
