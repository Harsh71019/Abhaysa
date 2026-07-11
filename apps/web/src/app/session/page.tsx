"use client";

import { Suspense, useEffect, useState, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import type { Card, Pack } from "@local/shared";
import { CardRunner } from "@/components/session/card-runner";
import { ensureDeckPackLoaded, ensureTodaysPackLoaded, getPackCards, requestPersistentStorage } from "@/lib/db";

function SessionContent(): ReactElement {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");
  const [pack, setPack] = useState<Pack | null>(null);
  const [cards, setCards] = useState<Card[] | null>(null);

  useEffect(() => {
    requestPersistentStorage();
    let cancelled = false;
    void (async () => {
      const loadedPack = deckId ? await ensureDeckPackLoaded(deckId) : await ensureTodaysPackLoaded();
      const loadedCards = await getPackCards(loadedPack);
      if (cancelled) {
        return;
      }
      setPack(loadedPack);
      setCards(loadedCards);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckId]);

  if (!pack || !cards) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center p-6">
        <p className="font-board text-sm uppercase tracking-[0.06em] text-foreground/70">Loading&hellip;</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-6">
      <CardRunner pack={pack} cards={cards} />
    </main>
  );
}

export default function SessionPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh flex-col items-center justify-center p-6">
          <p className="font-board text-sm uppercase tracking-[0.06em] text-foreground/70">Loading&hellip;</p>
        </main>
      }
    >
      <SessionContent />
    </Suspense>
  );
}
