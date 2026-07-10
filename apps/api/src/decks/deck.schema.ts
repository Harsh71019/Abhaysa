import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { pillarSchema, type Pillar } from "@local/shared";

export type DeckDocument = HydratedDocument<DeckEntity>;

const PILLAR_VALUES = pillarSchema.options;

@Schema({ collection: "decks" })
export class DeckEntity {
  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true, enum: PILLAR_VALUES })
  pillar!: Pillar;

  @Prop({ type: String, required: true })
  description!: string;

  @Prop({ type: Number, required: true, default: 0 })
  cardCount!: number;

  @Prop({ type: Number, required: true, default: 0 })
  order!: number;
}

export const DeckSchema = SchemaFactory.createForClass(DeckEntity);
