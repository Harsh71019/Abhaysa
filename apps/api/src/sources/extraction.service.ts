import { Injectable } from "@nestjs/common";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export interface ExtractedArticle {
  title: string;
  text: string;
}

/** Article extraction only — BACKEND_PLAN.md §6.1. No PDF/youtube-transcript yet. */
@Injectable()
export class ExtractionService {
  async extractArticle(url: string): Promise<ExtractedArticle> {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; LOCALBot/1.0; +https://local.app)" },
    });
    if (!res.ok) {
      throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const { document } = parseHTML(html);
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();
    if (!article?.textContent?.trim()) {
      throw new Error("readability could not extract article content");
    }
    return { title: article.title?.trim() || url, text: article.textContent.trim() };
  }
}
