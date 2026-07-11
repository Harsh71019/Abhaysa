import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";

export type ReviewLogDocument = HydratedDocument<ReviewLogEntity>;

@Schema({ collection: "reviewLogs" })
export class ReviewLogEntity {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true })
  cardId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Pack", required: true })
  packId!: Types.ObjectId;

  /** 1=again 2=hard 3=good 4=easy */
  @Prop({ type: Number, required: true })
  grade!: number;

  @Prop({ type: Number, required: true })
  tookMs!: number;

  @Prop({ type: Date, required: true })
  at!: Date;
}

export const ReviewLogSchema = SchemaFactory.createForClass(ReviewLogEntity);
ReviewLogSchema.index({ cardId: 1, at: -1 });
