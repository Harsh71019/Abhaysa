import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { Types } from "mongoose";
import { reviewStateStateSchema, type ReviewStateState } from "@local/shared";

export type ReviewStateDocument = HydratedDocument<ReviewStateEntity>;

const REVIEW_STATE_STATE_VALUES = reviewStateStateSchema.options;

@Schema({ collection: "reviewStates" })
export class ReviewStateEntity {
  @Prop({ type: Types.ObjectId, ref: "Card", required: true, unique: true })
  cardId!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  due!: Date;

  @Prop({ type: Number, required: true })
  stability!: number;

  @Prop({ type: Number, required: true })
  difficulty!: number;

  @Prop({ type: Number, required: true })
  elapsedDays!: number;

  @Prop({ type: Number, required: true })
  scheduledDays!: number;

  @Prop({ type: Number, required: true })
  reps!: number;

  @Prop({ type: Number, required: true })
  lapses!: number;

  @Prop({ type: String, required: true, enum: REVIEW_STATE_STATE_VALUES })
  state!: ReviewStateState;

  @Prop({ type: Date })
  lastReview?: Date;
}

export const ReviewStateSchema = SchemaFactory.createForClass(ReviewStateEntity);
ReviewStateSchema.index({ due: 1 });
