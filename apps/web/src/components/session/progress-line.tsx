import type { ReactElement } from "react";

interface ProgressLineProps {
  current: number;
  total: number;
}

export function ProgressLine({ current, total }: ProgressLineProps): ReactElement {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-border overflow-hidden relative">
      <div 
        className="h-full bg-accent rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
        style={{ width: `${pct}%` }} 
      />
    </div>
  );
}
