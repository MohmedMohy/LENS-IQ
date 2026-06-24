// src/features/profile/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/navigation/PageHeader";
import Card from "@/components/ui/card/Card";
import { profileApi } from "@/features/profile/api/profile.api";


export default function ProfilePage() {
  
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    useEffect(() => {
        profileApi.get()
            .then((data) => {
                setApiKey(data.api_key);
            })
            .catch((err) => {
                console.error("Failed to fetch profile", err);
                toast.error("فشل في تحميل بيانات الملف الشخصي");
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleCopyLink = () => {
        if (!apiKey) return;
        // إنشاء الرابط بناءً على النطاق الحالي للموقع
        const applyLink = `${window.location.origin}/apply/${apiKey}`;

        navigator.clipboard.writeText(applyLink)
            .then(() => toast.success("تم نسخ رابط التقديم بنجاح!"))
            .catch(() => toast.error("فشل في نسخ الرابط"));
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("كلمة المرور الجديدة غير متطابقة مع التأكيد");
            return;
        }
        setIsChangingPassword(true);
        try {
            await profileApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            toast.success("تم تغيير كلمة المرور بنجاح");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
            const msg = axiosErr?.response?.data?.error || axiosErr?.message || "فشل في تغيير كلمة المرور";
            toast.error(msg);
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <Layout>
            <PageHeader title="الملف الشخصي" description="إدارة بيانات المعرض ورابط التقديم" />

            <div className="mt-6 max-w-3xl space-y-6">
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">رابط التقديم للعملاء (Public Link)</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        شارك هذا الرابط مع عملائك ليتمكنوا من تقديم طلبات التمويل مباشرة. ستظهر جميع الطلبات المقدمة عبر هذا الرابط في لوحة التحكم الخاصة بك.
                    </p>

                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            readOnly
                            value={apiKey ? `${window.location.origin}/apply/${apiKey}` : "جاري التحميل..."}
                            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                            dir="ltr"
                        />
                        <button
                            onClick={handleCopyLink}
                            disabled={isLoading || !apiKey}
                            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            نسخ الرابط
                        </button>
                    </div>
                </Card>

                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-slate-800">تغيير كلمة المرور</h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الحالية</label>
                            <input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                                autoComplete="current-password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                                autoComplete="new-password"
                            />
                            <p className="text-xs text-slate-400 mt-1">يجب أن تكون 8 أحرف على الأقل</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400"
                                autoComplete="new-password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isChangingPassword ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
                        </button>
                    </form>
                </Card>
            </div>
        </Layout>
    );
}
