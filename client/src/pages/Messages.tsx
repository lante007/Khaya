import { useState } from "react";
import Navigation from "@/components/Navigation";
import { ChatList } from "@/components/ChatList";
import { ChatWindow } from "@/components/ChatWindow";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<{
    conversationId: string;
    receiverId: string;
    receiverName: string;
    jobId?: number;
  } | null>(null);
  
  const handleSelectConversation = (
    conversationId: string,
    receiverId: string,
    receiverName: string,
    jobId?: number
  ) => {
    setSelectedConversation({ conversationId, receiverId, receiverName, jobId });
  };
  
  const handleBack = () => {
    setSelectedConversation(null);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <div className="container py-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat List - Hidden on mobile when chat is open */}
          <div className={`md:col-span-1 ${selectedConversation ? 'hidden md:block' : ''}`}>
            <ChatList onSelectConversation={handleSelectConversation} />
          </div>
          
          {/* Chat Window */}
          <div className={`md:col-span-2 ${!selectedConversation ? 'hidden md:block' : ''}`}>
            {selectedConversation ? (
              <ChatWindow
                conversationId={selectedConversation.conversationId}
                receiverId={selectedConversation.receiverId}
                receiverName={selectedConversation.receiverName}
                jobId={selectedConversation.jobId}
                onBack={handleBack}
              />
            ) : (
              <div className="hidden md:flex items-center justify-center h-[600px] border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
