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

                {/* يمكنك إبقاء باقي بيانات الملف الشخصي هنا */}
            </div>
        </Layout>
    );
}