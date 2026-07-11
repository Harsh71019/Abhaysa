import type { ReactElement } from "react";
import ReactMarkdown from "react-markdown";

/** FRONTEND_PLAN.md §3: Literata, 17-18px, 1.6 line-height, max 34ch. */
export function CardMarkdown({ children }: { children: string }): ReactElement {
  return (
    <div className="max-w-[34ch] text-[17px] leading-[1.6] font-reading [&_code]:font-code [&_code]:text-[14px] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3 [&_strong]:font-semibold">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
