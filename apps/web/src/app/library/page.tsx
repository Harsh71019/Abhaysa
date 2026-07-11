"use client";

import Link from "next/link";
import { useEffect, useState, type ReactElement } from "react";
import type { Source } from "@local/shared";
import { listSources } from "@/lib/api";
import { PILLAR_LABELS, PILLAR_TEXT_COLOR, PILLAR_BG_COLOR } from "@/lib/pillar-colors";
import { SOURCE_KIND_EMOJI, SOURCE_KIND_LABEL, SOURCE_STATUS_LABEL, SOURCE_STATUS_CLASS } from "@/lib/source-kind";

export default function LibraryPage(): ReactElement {
  const [sources, setSources] = useState<Source[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listSources()
      .then((data) => {
        if (!cancelled) {
          setSources(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "failed to load library");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 p-6 pt-20">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <span className="font-board text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
              Library
            </span>
            <h1 className="mt-0.5 font-board text-xl font-bold tracking-tight text-foreground">
              Everything ingested
            </h1>
          </div>
          <Link
            href="/library/add"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-[0_4px_16px_rgba(99,102,241,0.25)] transition-all active:scale-95"
            title="Add a source"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
        </div>

        {error && (
          <div className="rounded-2xl border border-signal-stop/20 bg-signal-stop/10 p-4 text-sm text-signal-stop">
            {error}
          </div>
        )}

        {!error && !sources && (
          <p className="font-board text-sm uppercase tracking-[0.06em] text-foreground/50">Loading&hellip;</p>
        )}

        {sources && sources.length === 0 && (
          <div className="glass-card flex flex-col items-center gap-3 rounded-[24px] p-8 text-center">
            <p className="text-sm text-foreground/60">Nothing ingested yet.</p>
            <Link
              href="/library/add"
              className="font-board text-xs font-semibold uppercase tracking-wider text-accent"
            >
              Add your first source →
            </Link>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          {sources?.map((source) => (
            <li key={source._id}>
              <Link
                href={`/library/${source._id}`}
                className="glass-card flex items-center gap-3 rounded-2xl p-4 transition-all hover:border-accent/30 active:scale-[0.99]"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${PILLAR_BG_COLOR[source.pillar]}`}
                >
                  {SOURCE_KIND_EMOJI[source.kind]}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-semibold text-foreground">{source.title}</span>
                  <div className="flex items-center gap-2 text-[11px] font-board uppercase tracking-wider">
                    <span className={PILLAR_TEXT_COLOR[source.pillar]}>{PILLAR_LABELS[source.pillar]}</span>
                    <span className="text-foreground/30">·</span>
                    <span className="text-foreground/50">{SOURCE_KIND_LABEL[source.kind]}</span>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider font-board ${SOURCE_STATUS_CLASS[source.status]}`}
                >
                  {SOURCE_STATUS_LABEL[source.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
