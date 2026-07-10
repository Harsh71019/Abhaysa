import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { Deck } from "@local/shared";
import { DeckEntity, type DeckDocument } from "./deck.schema";

function toDeck(doc: DeckDocument): Deck {
  return {
    _id: doc._id.toString(),
    title: doc.title,
    pillar: doc.pillar,
    description: doc.description,
    cardCount: doc.cardCount,
    order: doc.order,
  };
}

@Injectable()
export class DecksService {
  constructor(@InjectModel(DeckEntity.name) private readonly deckModel: Model<DeckDocument>) {}

  async findAll(): Promise<Deck[]> {
    const docs = await this.deckModel.find().sort({ order: 1 }).exec();
    return docs.map(toDeck);
  }

  async findById(id: string): Promise<Deck> {
    const doc = await this.deckModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Deck ${id} not found`);
    }
    return toDeck(doc);
  }
}
