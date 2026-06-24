import Skeleton from "./Skeleton";

type StatsSkeletonProps = {
  count?: number;
};

export default function StatsSkeleton({ count = 3 }: StatsSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card p-5">
          <Skeleton className="mb-2 h-3 w-24" />
          <Skeleton className="mb-1 h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
