import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConversationCardProps {
  id: string;
  buyerName: string;
  subject: string | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  isSelected: boolean;
  onClick: () => void;
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isToday(date)) {
    return formatDistanceToNowStrict(date, { addSuffix: false })
      .replace(" seconds", "s")
      .replace(" second", "s")
      .replace(" minutes", "m")
      .replace(" minute", "m")
      .replace(" hours", "h")
      .replace(" hour", "h");
  }
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

const ConversationCard = ({
  id,
  buyerName,
  subject,
  lastMessagePreview,
  lastMessageAt,
  unreadCount,
  isSelected,
  onClick,
}: ConversationCardProps) => {
  const hasUnread = unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-border transition-colors hover:bg-muted/50",
        isSelected && "bg-muted",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0 mt-1",
              hasUnread ? "bg-primary" : "bg-muted-foreground/30"
            )}
          />
          <span
            className={cn(
              "font-sans text-sm truncate",
              hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"
            )}
          >
            {buyerName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasUnread && (
            <Badge
              variant="destructive"
              className="text-[10px] h-5 min-w-[20px] flex items-center justify-center px-1.5"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">
            {formatRelativeTime(lastMessageAt)}
          </span>
        </div>
      </div>

      {subject && (
        <p className="text-xs text-muted-foreground mt-1 ml-4 truncate">
          {subject}
        </p>
      )}

      {lastMessagePreview && (
        <p
          className={cn(
            "text-xs mt-0.5 ml-4 truncate",
            hasUnread ? "text-foreground/70" : "text-muted-foreground"
          )}
        >
          {truncate(lastMessagePreview, 80)}
        </p>
      )}
    </button>
  );
};

export default ConversationCard;
