import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { profileApi } from "@/features/profile/api/profile.api";

export default function Topbar() {
  const { t } = useTranslation();
  const tenant = useAuthStore((s) => s.tenant);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("topbar.passwordsMismatch"));
      return;
    }
    setIsChanging(true);
    try {
      await profileApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success(t("toasts.passwordUpdated"));
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(axiosErr?.response?.data?.error || axiosErr?.message || t("toasts.failed"));
    } finally {
      setIsChanging(false);
    }
  };

  const handleClose = () => {
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <header
        className="sticky top-0 z-20 border-b"
        style={{
          background: "var(--bg-card)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderColor: "var(--glass-border)",
        }}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {t("topbar.decisionEngine")}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t("topbar.financingManagement")}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="glass-btn glass-btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t("topbar.changePassword")}
            </motion.button>

            <div className="text-end">
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {tenant?.name ?? "Admin"}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {tenant?.role ?? t("topbar.unknown")}
              </p>
            </div>

            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{
                background: "linear-gradient(135deg, var(--primary), var(--primary-dark))",
              }}
              whileHover={{ scale: 1.05 }}
            >
              {(tenant?.name ?? "A").charAt(0).toUpperCase()}
            </motion.div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{
                background: "var(--bg-card)",
                backdropFilter: "blur(32px)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--glass-shadow-lg)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-1 text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                {t("topbar.changePwdTitle")}
              </h2>
              <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
                {t("topbar.changePwdDesc")}
              </p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {t("topbar.currentPwd")}
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-sm"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {t("topbar.newPwd")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-sm"
                    autoComplete="new-password"
                  />
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {t("topbar.newPwdHint")}
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {t("topbar.confirmPwd")}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-input w-full px-4 py-3 text-sm"
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="glass-btn glass-btn-secondary rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    {t("common.cancel")}
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isChanging}
                    className="glass-btn glass-btn-primary rounded-xl px-6 py-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isChanging ? t("topbar.savingPwd") : t("common.save")}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
