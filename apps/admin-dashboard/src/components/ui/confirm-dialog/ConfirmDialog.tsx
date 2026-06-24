import { motion, AnimatePresence } from "framer-motion";

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
};

export default function ConfirmDialog({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-2xl p-6"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(32px)",
              border: "1px solid var(--glass-border)",
              boxShadow: "var(--glass-shadow-lg)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
            <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>{message}</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="glass-btn glass-btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="glass-btn rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{
                  background: destructive
                    ? "linear-gradient(135deg, var(--error), #DC2626)"
                    : "linear-gradient(135deg, var(--primary), var(--primary-dark))",
                  boxShadow: destructive
                    ? "0 2px 12px rgba(239,68,68,0.3)"
                    : "0 2px 12px rgba(79,70,229,0.3)",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
