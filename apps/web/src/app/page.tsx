"use client";

import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { buildAttentionPackBundle } from "@local/shared";
import { Indicator } from "@/components/indicator";

// Phase 1: a local fixture pack, no network — the real /packs/today fetch
// (and the sync layer around it) lands in Phase 3.
const pack = buildAttentionPackBundle(new Date().toISOString().slice(0, 10));

export default function HomePage(): ReactElement {
  const router = useRouter();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <Indicator pack={pack} onBoardNow={() => router.push("/session")} />
    </main>
  );
}
