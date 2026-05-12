import StatusBadge from "./StatusBadge";
import RiskScoreGauge from "./RiskScoreGauge";

import type { DecisionResult } from "./types";

// شكل الـ props
type Props = {
    data: DecisionResult;
};

export default function DecisionCard({ data }: Props) {
    return (
        <div
            className="
        p-8
        rounded-3xl
        border
        border-white/10
        bg-[#0f172a]
        text-white
        shadow-2xl
        space-y-8
        max-w-2xl
      "
        >
            {/* عرض حالة القرار */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold">
                        Financing Decision
                    </h2>

                    <p className="text-sm text-white/70 mt-1">
                        Real-time financing evaluation result
                    </p>
                </div>

                {/* عرض شارة الحالة */}
                <StatusBadge status={data.status} />
            </div>

            {/* عرض مؤشر مستوى المخاطرة */}
            <div className="flex items-center justify-center">
                <RiskScoreGauge
               
                    score={data.riskScore}
                    level={data.riskLevel}
                />
            </div>

            {/* البيانات المالية */}
            <div className="grid grid-cols-2 gap-4">

                <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-xs opacity-60">
                        Monthly Installment
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                        {data.installment.toLocaleString()} EGP
                    </h3>
                </div>

                <div className="bg-white/5 rounded-2xl p-4">
                    <p className="text-xs opacity-60">
                        DTI Ratio
                    </p>

                    <h3 className="text-2xl font-bold mt-2">
                        {data.dti}%
                    </h3>
                </div>

            </div>

            {/* الأسباب */}
            <div className="space-y-3">

                <h4 className="text-lg font-semibold">
                    Decision Reasons
                </h4>

                {data.reasons.map(
                    (
                        reason: { message: string },
                        index: number
                    ) => (
                        <div
                            key={index}
                            className="
                p-4
                rounded-2xl
                bg-white/5
                border
                border-white/10
              "
                        >
                            <p className="text-sm">
                                {reason.message}
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}