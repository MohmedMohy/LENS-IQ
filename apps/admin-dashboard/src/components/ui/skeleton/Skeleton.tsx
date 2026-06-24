type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`skeleton-pulse rounded-xl ${className}`}
      aria-hidden="true"
    />
  );
}
