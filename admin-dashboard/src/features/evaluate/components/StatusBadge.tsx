import type { DecisionStatus } from "./types";

//شكل الprops 
type props ={
    status: DecisionStatus;
};
export default function StatusBadge({status}:props) {

    //تحديد اللون بناءً على الحالة
        const styles :Record<DecisionStatus, string> = {
        APPROVED: "bg-green-500/20 text-green-400 border-green-500/40",
        CONDITIONAL: "bg-amber-500/20 text-yellow-400 border-yellow-500/40",
        REJECTED: "bg-red-500/20 text-red-400 border-red-500/40",
    };

    return (
        < div 
         className={`px-4 py-2 rounded-full text-sm font-semibold tracking-wide
            w-fit ${ styles[status]}` }>
            {status}

            </div>   
    );
}