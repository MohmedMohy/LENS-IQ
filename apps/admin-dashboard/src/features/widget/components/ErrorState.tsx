type Props = {
  error: string;
  onRetry: () => void;
  onMock: () => void;
};

export default function ErrorState({ error, onRetry, onMock }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
        <span className="text-xl text-red-500">!</span>
      </div>
      <p className="mb-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Evaluation failed
      </p>
      <p className="mb-4 max-w-xs text-xs" style={{ color: "var(--text-muted)" }}>
        {error}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-400 transition-colors hover:bg-indigo-500/20"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={onMock}
          className="rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)" }}
        >
          Use Mock Data
        </button>
      </div>
    </div>
  );
}
