export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <div className="mb-3 text-3xl opacity-30">◇</div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        No evaluation yet
      </p>
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
        Select an application and run evaluation
      </p>
    </div>
  );
}
