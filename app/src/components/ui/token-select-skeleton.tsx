import { Skeleton } from "./skeleton";

export const TokenSelectSkeleton = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center relative">
        <Skeleton className="w-6 h-6 rounded-full" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full">
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-4 h-4" />
    </div>
  );
};
