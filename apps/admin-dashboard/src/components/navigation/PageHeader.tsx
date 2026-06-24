import { motion } from "framer-motion";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  hideAction?: boolean;
};

export default function PageHeader({
  title,
  description,
  action,
  actionLabel,
  hideAction,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 flex items-center justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      {action && !hideAction && (
        <motion.button
          type="button"
          onClick={action}
          className="glass-btn glass-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {actionLabel || "Add"}
        </motion.button>
      )}
    </motion.div>
  );
}
