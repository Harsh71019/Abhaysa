"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type ReactElement } from "react";
import ReactMarkdown from "react-markdown";
import type { Card, Source } from "@local/shared";
import { getCardsByDeck, getSource } from "@/lib/api";
import { PILLAR_LABELS, PILLAR_TEXT_COLOR } from "@/lib/pillar-colors";
import { SOURCE_KIND_EMOJI, SOURCE_STATUS_LABEL, SOURCE_STATUS_CLASS } from "@/lib/source-kind";

export default function ReaderPage({ params }: { params: Promise<{ id: string }> }): ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const [source, setSource] = useState<Source | null>(null);
  const [cardCount, setCardCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await getSource(id);
        if (cancelled) {
          return;
        }
        setSource(loaded);
        if (loaded.deckId) {
          const cards: Card[] = await getCardsByDeck(loaded.deckId);
          if (!cancelled) {
            setCardCount(cards.length);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "failed to load source");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-signal-stop">{error}</p>
        <Link href="/library" className="font-board text-xs font-semibold uppercase tracking-wider text-accent">
          ← Back to Library
        </Link>
      </main>
    );
  }

  if (!source) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center p-6">
        <p className="font-board text-sm uppercase tracking-[0.06em] text-foreground/50">Loading&hellip;</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 p-6 pt-20">
      <div className="w-full max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/library"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border text-foreground/75 transition-all active:scale-95"
            title="Back to Library"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-board font-semibold uppercase tracking-wider">
            <span className={PILLAR_TEXT_COLOR[source.pillar]}>{PILLAR_LABELS[source.pillar]}</span>
            <span className="text-foreground/30">·</span>
            <span
              className={`rounded-full border px-2 py-0.5 ${SOURCE_STATUS_CLASS[source.status]}`}
            >
              {SOURCE_STATUS_LABEL[source.status]}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-[24px] p-6 sm:p-8">
          <h1 className="font-board text-2xl font-bold tracking-tight text-foreground">
            {SOURCE_KIND_EMOJI[source.kind]} {source.title}
          </h1>
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-xs text-accent hover:underline"
            >
              {source.url}
            </a>
          )}

          {source.status === "failed" && (
            <p className="mt-4 rounded-xl border border-signal-stop/20 bg-signal-stop/10 p-3 text-sm text-signal-stop">
              Extraction failed{source.failureReason ? `: ${source.failureReason}` : "."}
            </p>
          )}

          {source.rawText && (
            <div className="mt-6 max-w-none text-[17px] leading-[1.7] font-reading [&_p]:mb-4 [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:font-board [&_h1]:text-xl [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:font-board [&_h2]:text-lg [&_a]:text-accent [&_a]:underline [&_code]:font-code [&_code]:text-[14px] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-background [&_pre]:p-3 [&_strong]:font-semibold">
              <ReactMarkdown>{source.rawText}</ReactMarkdown>
            </div>
          )}
        </div>

        {source.deckId && cardCount > 0 && (
          <button
            type="button"
            onClick={() => router.push(`/session?deckId=${source.deckId}`)}
            className="mt-5 min-h-[56px] w-full rounded-2xl bg-accent text-white font-board text-sm font-semibold uppercase tracking-[0.1em] shadow-[0_4px_20px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98]"
          >
            Study these {cardCount} cards
          </button>
        )}
      </div>
    </main>
  );
}
