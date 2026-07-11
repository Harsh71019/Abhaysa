import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import {
  pillarSchema,
  sourceKindSchema,
  sourceStatusSchema,
  type Pillar,
  type SourceKind,
  type SourceStatus,
} from "@local/shared";

export type SourceDocument = HydratedDocument<SourceEntity>;

const PILLAR_VALUES = pillarSchema.options;
const SOURCE_KIND_VALUES = sourceKindSchema.options;
const SOURCE_STATUS_VALUES = sourceStatusSchema.options;

@Schema({ collection: "sources" })
export class SourceEntity {
  @Prop({ type: String })
  url?: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, required: true, enum: SOURCE_KIND_VALUES })
  kind!: SourceKind;

  @Prop({ type: String, required: true, enum: PILLAR_VALUES })
  pillar!: Pillar;

  @Prop({ type: String, required: true, enum: SOURCE_STATUS_VALUES, default: "queued" })
  status!: SourceStatus;

  @Prop({ type: String })
  rawText?: string;

  @Prop({ type: String })
  failureReason?: string;

  @Prop({ type: Types.ObjectId, ref: "Deck" })
  deckId?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  addedAt!: Date;
}

export const SourceSchema = SchemaFactory.createForClass(SourceEntity);
SourceSchema.index({ status: 1 });
