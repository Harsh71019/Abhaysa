import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { Card, CreateCardInput } from "@local/shared";
import { CardEntity, type CardDocument } from "./card.schema";

function toCard(doc: CardDocument): Card {
  const base: Card = {
    _id: doc._id.toString(),
    deckId: doc.deckId.toString(),
    pillar: doc.pillar,
    type: doc.type,
    front: doc.front,
    back: doc.back,
    difficulty: doc.difficulty,
    estSeconds: doc.estSeconds,
    tags: doc.tags,
    createdAt: doc.createdAt,
  };
  return {
    ...base,
    ...(doc.sourceId ? { sourceId: doc.sourceId.toString() } : {}),
    ...(doc.quiz ? { quiz: doc.quiz } : {}),
    ...(doc.embedding && doc.embedding.length > 0 ? { embedding: doc.embedding } : {}),
  };
}

@Injectable()
export class CardsService {
  constructor(@InjectModel(CardEntity.name) private readonly cardModel: Model<CardDocument>) {}

  async findAll(deckId?: string): Promise<Card[]> {
    const filter = deckId ? { deckId: new Types.ObjectId(deckId) } : {};
    const docs = await this.cardModel.find(filter).exec();
    return docs.map(toCard);
  }

  async findById(id: string): Promise<Card> {
    const doc = await this.cardModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Card ${id} not found`);
    }
    return toCard(doc);
  }

  async create(input: CreateCardInput): Promise<Card> {
    const doc = await this.cardModel.create({
      ...input,
      deckId: new Types.ObjectId(input.deckId),
      createdAt: new Date(),
    });
    return toCard(doc);
  }
}
