import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Send, Paperclip, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: string;
  receiverId: string;
  receiverName: string;
  jobId?: number;
  onBack?: () => void;
}

export function ChatWindow({ 
  conversationId, 
  receiverId, 
  receiverName,
  jobId,
  onBack 
}: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout>();
  
  const { data: user } = trpc.auth.me.useQuery();
  const sendMessage = trpc.messages.send.useMutation();
  const { data: messagesData, refetch } = trpc.messages.list.useQuery({
    conversationId,
    limit: 50,
  });
  
  // Load messages
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Polling for new messages
  useEffect(() => {
    // Poll every 3 seconds
    pollIntervalRef.current = setInterval(() => {
      refetch();
    }, 3000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [refetch]);
  
  const handleSend = async () => {
    if (!message.trim()) return;
    
    const messageText = message;
    setMessage(""); // Clear input immediately
    
    // Optimistic update
    const tempMessage = {
      id: `temp_${Date.now()}`,
      senderId: user?.id,
      content: messageText,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      await sendMessage.mutateAsync({
        receiverId,
        content: messageText,
        jobId,
      });
      
      // Refetch to get the real message
      refetch();
    } catch (error) {
      toast.error("Failed to send message");
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{receiverName}</CardTitle>
            {jobId && (
              <p className="text-sm text-muted-foreground">Job #{jobId}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2",
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <div className={cn(
                    "flex items-center gap-2 mt-1",
                    isOwn ? "justify-end" : "justify-start"
                  )}>
                    <span className={cn(
                      "text-xs",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatTime(msg.createdAt)}
                    </span>
                    {msg.status === 'sending' && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" disabled>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button 
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            size="icon"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
