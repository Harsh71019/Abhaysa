import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import { cardTypeSchema, pillarSchema, type CardDifficulty, type CardType, type Pillar } from "@local/shared";

export type CardDocument = HydratedDocument<CardEntity>;

const PILLAR_VALUES = pillarSchema.options;
const CARD_TYPE_VALUES = cardTypeSchema.options;
/** Must match cardDifficultySchema in packages/shared/src/schemas.ts. */
const CARD_DIFFICULTY_VALUES = [1, 2, 3] as const;

@Schema({ _id: false })
export class CardQuizEntity {
  @Prop({ type: [String], required: true })
  options!: string[];

  @Prop({ type: Number, required: true })
  correctIndex!: number;

  @Prop({ type: [String], required: true })
  explanations!: string[];
}

export const CardQuizSchema = SchemaFactory.createForClass(CardQuizEntity);

@Schema({ collection: "cards" })
export class CardEntity {
  @Prop({ type: Types.ObjectId, ref: "Deck", required: true })
  deckId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Source" })
  sourceId?: Types.ObjectId;

  @Prop({ type: String, required: true, enum: PILLAR_VALUES })
  pillar!: Pillar;

  @Prop({ type: String, required: true, enum: CARD_TYPE_VALUES })
  type!: CardType;

  @Prop({ type: String, required: true })
  front!: string;

  @Prop({ type: String, required: true })
  back!: string;

  @Prop({ type: CardQuizSchema })
  quiz?: CardQuizEntity;

  @Prop({ type: Number, required: true, enum: CARD_DIFFICULTY_VALUES })
  difficulty!: CardDifficulty;

  @Prop({ type: Number, required: true })
  estSeconds!: number;

  @Prop({ type: [String], required: true, default: [] })
  tags!: string[];

  @Prop({ type: [Number] })
  embedding?: number[];

  @Prop({ type: Date, required: true })
  createdAt!: Date;
}

export const CardSchema = SchemaFactory.createForClass(CardEntity);
CardSchema.index({ deckId: 1 });
CardSchema.index({ tags: 1 });
