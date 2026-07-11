import type { Card, CreateSourceInput, Deck, Source, SourceStatus } from "@local/shared";

/**
 * First network-touching module in the web app — Phase 2 was fixture/offline-only
 * (see lib/db.ts). Library/Reader need live source ingestion, so this talks
 * straight to the API; card-runner sessions still go through Dexie only.
 */
const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function listSources(status?: SourceStatus): Promise<Source[]> {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<Source[]>(`/sources${qs}`);
}

export function getSource(id: string): Promise<Source> {
  return apiFetch<Source>(`/sources/${id}`);
}

export function createSource(input: CreateSourceInput): Promise<Source> {
  return apiFetch<Source>("/sources", { method: "POST", body: JSON.stringify(input) });
}

export function getDeck(id: string): Promise<Deck> {
  return apiFetch<Deck>(`/decks/${id}`);
}

export function getCardsByDeck(deckId: string): Promise<Card[]> {
  return apiFetch<Card[]>(`/cards?deckId=${deckId}`);
}
