import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ConversationCard from "./ConversationCard";
import ConversationListSkeleton from "./ConversationListSkeleton";

export interface ConversationItem {
  id: string;
  buyerName: string;
  subject: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  isLoading: boolean;
  activeConvId: string | null;
  onSelect: (id: string) => void;
}

const ConversationList = ({
  conversations,
  isLoading,
  activeConvId,
  onSelect,
}: ConversationListProps) => {
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Sort: unread first, then by lastMessageAt descending
  const sorted = [...conversations].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold">Messages</h2>
        {totalUnread > 0 && (
          <Badge variant="destructive" className="text-xs">
            {totalUnread}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              No conversations yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Messages from buyers will appear here.
            </p>
          </div>
        ) : (
          sorted.map((conv) => (
            <ConversationCard
              key={conv.id}
              id={conv.id}
              buyerName={conv.buyerName}
              subject={conv.subject}
              lastMessagePreview={conv.lastMessagePreview}
              lastMessageAt={conv.lastMessageAt}
              unreadCount={conv.unreadCount}
              isSelected={conv.id === activeConvId}
              onClick={() => onSelect(conv.id)}
            />
          ))
        )}
      </ScrollArea>
    </div>
  );
};

export default ConversationList;
