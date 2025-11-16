import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatListProps {
  onSelectConversation: (conversationId: string, receiverId: string, receiverName: string, jobId?: number) => void;
}

export function ChatList({ onSelectConversation }: ChatListProps) {
  const { data, isLoading } = trpc.messages.getConversations.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  const conversations = data?.conversations || [];
  
  const getOtherUserId = (participants: string[]) => {
    return participants.find(id => id !== user?.id) || '';
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No conversations yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Start chatting with workers or buyers
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {conversations.map((conv) => {
            const otherUserId = getOtherUserId(conv.participants);
            const unreadCount = conv.unreadCount?.[user?.id || ''] || 0;
            
            return (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(
                  conv.id,
                  otherUserId,
                  otherUserId, // TODO: Get actual name from user profile
                  conv.jobId
                )}
                className={cn(
                  "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                  unreadCount > 0 && "bg-muted/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {otherUserId.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className={cn(
                        "font-medium truncate",
                        unreadCount > 0 && "font-semibold"
                      )}>
                        {otherUserId}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(conv.lastMessageAt || conv.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-sm text-muted-foreground truncate",
                        unreadCount > 0 && "font-medium text-foreground"
                      )}>
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <Badge 
                          variant="default" 
                          className="ml-2 flex-shrink-0 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    
                    {conv.jobId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Job #{conv.jobId}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
