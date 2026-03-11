import { Skeleton } from "@/components/ui/skeleton";

const ConversationListSkeleton = () => (
  <div className="divide-y divide-border">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-40 ml-4" />
        <Skeleton className="h-3 w-52 ml-4" />
      </div>
    ))}
  </div>
);

export default ConversationListSkeleton;
