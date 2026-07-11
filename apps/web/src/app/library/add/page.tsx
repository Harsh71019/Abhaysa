"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { pillarSchema, type Pillar } from "@local/shared";
import { createSource } from "@/lib/api";
import { PILLAR_LABELS } from "@/lib/pillar-colors";

type Mode = "link" | "paste";

const PILLARS = pillarSchema.options;

export default function AddSourcePage(): ReactElement {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("link");
  const [title, setTitle] = useState("");
  const [pillar, setPillar] = useState<Pillar>("dsa");
  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const source =
        mode === "link"
          ? await createSource({ title, pillar, kind: "article", url })
          : await createSource({ title, pillar, kind: "manual", rawText });
      router.push(`/library/${source._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to add source");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 p-6 pt-20">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/library"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border text-foreground/75 transition-all active:scale-95"
            title="Back to Library"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <span className="font-board text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
              Library
            </span>
            <h1 className="mt-0.5 font-board text-xl font-bold tracking-tight text-foreground">Add a source</h1>
          </div>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="glass-card flex flex-col gap-5 rounded-[24px] p-6">
          {/* Mode toggle */}
          <div className="flex rounded-xl border border-border bg-surface/50 p-1">
            {(["link", "paste"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 font-board text-xs font-semibold uppercase tracking-wider transition-all ${
                  mode === m ? "bg-accent text-white" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                {m === "link" ? "Link" : "Paste text"}
              </button>
            ))}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-board text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Title
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "link" ? "Article title" : "e.g. STAR: Kafka migration"}
              className="rounded-xl border border-border bg-surface/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent/60"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-board text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
              Pillar
            </span>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as Pillar)}
              className="rounded-xl border border-border bg-surface/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent/60"
            >
              {PILLARS.map((p) => (
                <option key={p} value={p}>
                  {PILLAR_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          {mode === "link" ? (
            <label className="flex flex-col gap-1.5">
              <span className="font-board text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                URL
              </span>
              <input
                required
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/post"
                className="rounded-xl border border-border bg-surface/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent/60"
              />
            </label>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="font-board text-[11px] font-semibold uppercase tracking-wider text-foreground/60">
                Text
              </span>
              <textarea
                required
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste or write the source text here…"
                className="resize-none rounded-xl border border-border bg-surface/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent/60"
              />
            </label>
          )}

          {error && <p className="text-sm text-signal-stop">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="min-h-[52px] w-full rounded-2xl bg-accent text-white font-board text-sm font-semibold uppercase tracking-[0.1em] shadow-[0_4px_16px_rgba(99,102,241,0.25)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? "Ingesting…" : mode === "link" ? "Fetch & extract" : "Save note"}
          </button>
        </form>
      </div>
    </main>
  );
}
