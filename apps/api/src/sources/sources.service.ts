import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { CreateSourceInput, Source, SourceStatus } from "@local/shared";
import { DecksService } from "../decks/decks.service";
import { ExtractionService } from "./extraction.service";
import { SourceEntity, type SourceDocument } from "./source.schema";

function toSource(doc: SourceDocument): Source {
  const base: Source = {
    _id: doc._id.toString(),
    title: doc.title,
    kind: doc.kind,
    pillar: doc.pillar,
    status: doc.status,
    addedAt: doc.addedAt,
  };
  return {
    ...base,
    ...(doc.url ? { url: doc.url } : {}),
    ...(doc.rawText ? { rawText: doc.rawText } : {}),
    ...(doc.failureReason ? { failureReason: doc.failureReason } : {}),
    ...(doc.deckId ? { deckId: doc.deckId.toString() } : {}),
  };
}

@Injectable()
export class SourcesService {
  constructor(
    @InjectModel(SourceEntity.name) private readonly sourceModel: Model<SourceDocument>,
    private readonly decksService: DecksService,
    private readonly extractionService: ExtractionService,
  ) {}

  async findAll(status?: SourceStatus): Promise<Source[]> {
    const filter = status ? { status } : {};
    const docs = await this.sourceModel.find(filter).sort({ addedAt: -1 }).exec();
    return docs.map(toSource);
  }

  async findById(id: string): Promise<Source> {
    const doc = await this.sourceModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Source ${id} not found`);
    }
    return toSource(doc);
  }

  /**
   * Extraction runs synchronously in the request (Phase 3.5 scope: no queue/worker
   * yet). On success, auto-creates the 1:1 Deck the Source's cards will live in.
   */
  async create(input: CreateSourceInput): Promise<Source> {
    const doc = await this.sourceModel.create({
      ...(input.url ? { url: input.url } : {}),
      title: input.title,
      kind: input.kind,
      pillar: input.pillar,
      status: "queued",
      addedAt: new Date(),
    });

    let extracted: { title: string; text: string };
    try {
      extracted =
        input.kind === "manual"
          ? { title: input.title, text: input.rawText! }
          : await this.extractionService.extractArticle(input.url!);
    } catch (err) {
      doc.status = "failed";
      doc.failureReason = err instanceof Error ? err.message : "extraction failed";
      await doc.save();
      return toSource(doc);
    }

    const deck = await this.decksService.create({
      title: doc.title,
      pillar: doc.pillar,
      description: `Cards from "${doc.title}"`,
    });

    doc.rawText = extracted.text;
    doc.status = "extracted";
    doc.deckId = new Types.ObjectId(deck._id);
    await doc.save();
    return toSource(doc);
  }
}
