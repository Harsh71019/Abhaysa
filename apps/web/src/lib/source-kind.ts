import type { SourceKind, SourceStatus } from "@local/shared";

export const SOURCE_KIND_EMOJI: Record<SourceKind, string> = {
  article: "🔗",
  manual: "✍️",
  pdf: "📄",
  "youtube-transcript": "🎬",
};

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  article: "Link",
  manual: "Note",
  pdf: "PDF",
  "youtube-transcript": "Transcript",
};

export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  queued: "Queued",
  extracted: "Extracted",
  carded: "Carded",
  failed: "Failed",
};

export const SOURCE_STATUS_CLASS: Record<SourceStatus, string> = {
  queued: "text-amber bg-amber/10 border-amber/10",
  extracted: "text-signal-go bg-signal-go/10 border-signal-go/10",
  carded: "text-accent bg-accent-soft border-accent/10",
  failed: "text-signal-stop bg-signal-stop/10 border-signal-stop/10",
};
