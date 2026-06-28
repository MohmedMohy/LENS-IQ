export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-center gap-3">
        <div className="h-4 w-28 animate-pulse rounded" style={{ background: "var(--glass-border)" }} />
        <div className="h-4 w-20 animate-pulse rounded-full" style={{ background: "var(--glass-border)" }} />
      </div>
      <div className="h-6 w-24 animate-pulse rounded" style={{ background: "var(--glass-border)" }} />
      <div className="space-y-3 rounded-xl p-4" style={{ background: "var(--bg-card)" }}>
        <div className="h-4 w-36 animate-pulse rounded" style={{ background: "var(--glass-border)" }} />
        <div className="h-8 w-40 animate-pulse rounded" style={{ background: "var(--glass-border)" }} />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded" style={{ background: "var(--glass-border)" }} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl" style={{ background: "var(--glass-border)" }} />
        ))}
      </div>
    </div>
  );
}
