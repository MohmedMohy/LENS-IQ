import Skeleton from "./Skeleton";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "var(--glass-border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--bg-card)" }}>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
            <th className="px-4 py-3">
              <Skeleton className="ml-auto h-3 w-16" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--glass-border)" }}>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} style={{ background: "var(--bg-card)" }}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton className={`h-4 ${c === 0 ? "w-32" : "w-24"}`} />
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-6 w-14" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
