import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import { packLegSchema, packStatusSchema, type PackLeg, type PackStatus } from "@local/shared";

export type PackDocument = HydratedDocument<PackEntity>;

const PACK_LEG_VALUES = packLegSchema.options;
const PACK_STATUS_VALUES = packStatusSchema.options;

@Schema({ collection: "packs" })
export class PackEntity {
  /** YYYY-MM-DD */
  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, required: true, enum: PACK_LEG_VALUES })
  leg!: PackLeg;

  @Prop({ type: [Types.ObjectId], ref: "Card", required: true, default: [] })
  cardIds!: Types.ObjectId[];

  @Prop({ type: String, required: true })
  theme!: string;

  @Prop({ type: Number, required: true })
  estMinutes!: number;

  @Prop({ type: String, required: true, enum: PACK_STATUS_VALUES, default: "ready" })
  status!: PackStatus;
}

export const PackSchema = SchemaFactory.createForClass(PackEntity);
PackSchema.index({ date: 1, leg: 1 }, { unique: true });
