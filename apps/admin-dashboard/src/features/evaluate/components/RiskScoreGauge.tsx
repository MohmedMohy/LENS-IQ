import type { RiskLevel } from "./types";

// شكل الـ props
type Props = {
    score: number;
    level: RiskLevel;
};

export default function RiskScoreGauge({
    score,
    level,
}: Props) {

    // تحديد اللون بناءً على مستوى المخاطرة
    const colors: Record<RiskLevel, string> = {
        LOW: "bg-green-400/20 border-green-500/40 text-green-300",
        MEDIUM: "bg-amber-400/20 border-amber-500/40 text-amber-300",
        HIGH: "bg-red-500/20 border-red-500/40 text-red-300",
    };

    return (
        <div
            className={`
        w-40
        h-40
        rounded-full
        border-4
        flex
        flex-col
        items-center
        justify-center
        backdrop-blur-md
        bg-white/5
        ${colors[level]}
      `}
        >

            {/* عرض النسبة المئوية */}
            <span className="text-4xl font-bold">
                {score}%
            </span>

            {/* مستوى المخاطرة */}
            <span className="text-sm uppercase mt-1">
                {level}
            </span>

            {/* النص السفلي */}
            <span className="text-xs tracking-widest mt-2 opacity-70">
                RISK SCORE
            </span>

        </div>
    );
}