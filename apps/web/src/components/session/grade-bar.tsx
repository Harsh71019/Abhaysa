import type { ReactElement } from "react";
import type { ReviewGrade } from "@local/shared";

interface GradeBarProps {
  onGrade: (grade: ReviewGrade) => void;
}

interface GradeOption {
  grade: ReviewGrade;
  label: string;
  className: string;
}

const GRADES: ReadonlyArray<GradeOption> = [
  { 
    grade: 1, 
    label: "Again", 
    className: "border-red-500/25 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 focus:border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.02)]" 
  },
  { 
    grade: 2, 
    label: "Hard", 
    className: "border-amber-500/25 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500/40 focus:border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.02)]" 
  },
  { 
    grade: 3, 
    label: "Good", 
    className: "border-indigo-500/25 bg-indigo-500/5 text-indigo-500 hover:bg-indigo-500/10 hover:border-indigo-500/40 focus:border-indigo-500/60 shadow-[0_0_8px_rgba(99,102,241,0.02)]" 
  },
  { 
    grade: 4, 
    label: "Easy", 
    className: "border-emerald-500/25 bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/40 focus:border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.02)]" 
  },
];

export function GradeBar({ onGrade }: GradeBarProps): ReactElement {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {GRADES.map(({ grade, label, className }) => (
        <button
          key={grade}
          type="button"
          onClick={() => onGrade(grade)}
          className={`min-h-[48px] rounded-xl border font-board text-xs font-semibold uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center ${className}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
