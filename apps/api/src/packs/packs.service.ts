import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { Card, Pack, PackBundle, PackLeg } from "@local/shared";
import { CardEntity, type CardDocument } from "../cards/card.schema";
import { toCard } from "../cards/cards.service";
import { DeckEntity, type DeckDocument } from "../decks/deck.schema";
import { ReviewStateEntity, type ReviewStateDocument } from "../reviews/review-state.schema";
import { todayInTimeZone } from "./date-utils";
import { PackEntity, type PackDocument } from "./pack.schema";
import { sequenceEveningPack, sequenceMorningPack } from "./pack-sequencer";

const MORNING_BUDGET_MINUTES = 35;
const TIME_ZONE = "Asia/Kolkata";

function toPack(doc: PackDocument): Pack {
  return {
    _id: doc._id.toString(),
    date: doc.date,
    leg: doc.leg,
    cardIds: doc.cardIds.map((id) => id.toString()),
    theme: doc.theme,
    estMinutes: doc.estMinutes,
    status: doc.status,
  };
}

@Injectable()
export class PacksService {
  constructor(
    @InjectModel(PackEntity.name) private readonly packModel: Model<PackDocument>,
    @InjectModel(CardEntity.name) private readonly cardModel: Model<CardDocument>,
    @InjectModel(DeckEntity.name) private readonly deckModel: Model<DeckDocument>,
    @InjectModel(ReviewStateEntity.name)
    private readonly reviewStateModel: Model<ReviewStateDocument>,
  ) {}

  private async hydrateCardsInOrder(cardIds: Types.ObjectId[]): Promise<Card[]> {
    const docs = await this.cardModel.find({ _id: { $in: cardIds } }).exec();
    const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));
    const cards: Card[] = [];
    for (const id of cardIds) {
      const doc = byId.get(id.toString());
      if (doc) {
        cards.push(toCard(doc));
      }
    }
    return cards;
  }

  private async getDueReviewCards(now: Date): Promise<Card[]> {
    const dueStates = await this.reviewStateModel
      .find({ due: { $lte: now } })
      .sort({ due: 1 })
      .limit(50)
      .exec();
    return this.hydrateCardsInOrder(dueStates.map((state) => state.cardId));
  }

  private async getNewCards(): Promise<Card[]> {
    const introducedCardIds = await this.reviewStateModel.distinct("cardId").exec();
    const docs = await this.cardModel
      .find({ _id: { $nin: introducedCardIds } })
      .sort({ createdAt: 1 })
      .exec();
    return docs.map(toCard);
  }

  private async buildMorningTheme(newCards: Card[]): Promise<string> {
    if (newCards.length === 0) {
      return "Review day — no new cards left in this deck.";
    }
    const deckId = newCards[0]?.deckId;
    const deck = deckId ? await this.deckModel.findById(deckId).exec() : null;
    return deck ? `${deck.title} — continuing today's material.` : "Today's cards.";
  }

  async generateMorningPack(date: string): Promise<Pack> {
    const now = new Date();
    const dueReviewCards = await this.getDueReviewCards(now);
    const newCards = await this.getNewCards();
    const sequenced = sequenceMorningPack({
      dueReviewCards,
      newCards,
      estMinutesBudget: MORNING_BUDGET_MINUTES,
    });
    const theme = await this.buildMorningTheme(newCards);
    const estMinutes = Math.round(sequenced.reduce((sum, card) => sum + card.estSeconds, 0) / 60);

    const doc = await this.packModel.findOneAndUpdate(
      { date, leg: "morning" },
      {
        date,
        leg: "morning",
        cardIds: sequenced.map((card) => new Types.ObjectId(card._id)),
        theme,
        estMinutes,
        status: "ready",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!doc) {
      throw new NotFoundException("Failed to generate morning pack");
    }
    return toPack(doc);
  }

  async generateEveningPack(date: string): Promise<Pack> {
    const morningDoc = await this.packModel.findOne({ date, leg: "morning" }).exec();
    if (!morningDoc) {
      throw new NotFoundException(`No morning pack for ${date} yet — generate that first.`);
    }
    const morningCards = await this.hydrateCardsInOrder(morningDoc.cardIds);
    const dueReviewCards = await this.getDueReviewCards(new Date());
    const sequenced = sequenceEveningPack(morningCards, dueReviewCards);
    const estMinutes = Math.round(sequenced.reduce((sum, card) => sum + card.estSeconds, 0) / 60);

    const doc = await this.packModel.findOneAndUpdate(
      { date, leg: "evening" },
      {
        date,
        leg: "evening",
        cardIds: sequenced.map((card) => new Types.ObjectId(card._id)),
        theme: "Evening recall — quiz and articulate cards from this morning.",
        estMinutes,
        status: "ready",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (!doc) {
      throw new NotFoundException("Failed to generate evening pack");
    }
    return toPack(doc);
  }

  async generateForToday(leg: PackLeg): Promise<Pack> {
    const date = todayInTimeZone(TIME_ZONE);
    return leg === "morning" ? this.generateMorningPack(date) : this.generateEveningPack(date);
  }

  async getBundle(date: string, leg: PackLeg): Promise<PackBundle> {
    const doc = await this.packModel.findOne({ date, leg }).exec();
    if (!doc) {
      throw new NotFoundException(`No ${leg} pack for ${date}`);
    }
    const cards = await this.hydrateCardsInOrder(doc.cardIds);
    return { ...toPack(doc), cards };
  }

  async getTodayBundle(leg: PackLeg): Promise<PackBundle> {
    return this.getBundle(todayInTimeZone(TIME_ZONE), leg);
  }
}
