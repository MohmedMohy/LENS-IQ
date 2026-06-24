import Skeleton from "./Skeleton";

type CardSkeletonProps = {
  lines?: number;
};

export default function CardSkeleton({ lines = 3 }: CardSkeletonProps) {
  return (
    <div className="glass-card p-5">
      <Skeleton className="mb-3 h-5 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`mb-2 h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`} />
      ))}
    </div>
  );
}
