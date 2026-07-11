import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { applyReviewGrade, type ReviewBatch, type ReviewBatchResponse, type ReviewStateFields } from "@local/shared";
import { ReviewLogEntity, type ReviewLogDocument } from "./review-log.schema";
import { ReviewStateEntity, type ReviewStateDocument } from "./review-state.schema";

function toReviewStateFields(doc: ReviewStateDocument): ReviewStateFields {
  return {
    due: doc.due,
    stability: doc.stability,
    difficulty: doc.difficulty,
    elapsedDays: doc.elapsedDays,
    scheduledDays: doc.scheduledDays,
    reps: doc.reps,
    lapses: doc.lapses,
    state: doc.state,
    ...(doc.lastReview ? { lastReview: doc.lastReview } : {}),
  };
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(ReviewStateEntity.name)
    private readonly reviewStateModel: Model<ReviewStateDocument>,
    @InjectModel(ReviewLogEntity.name) private readonly reviewLogModel: Model<ReviewLogDocument>,
  ) {}

  async applyBatch(batch: ReviewBatch): Promise<ReviewBatchResponse> {
    let applied = 0;
    let skipped = 0;

    for (const item of batch) {
      const existing = await this.reviewStateModel.findOne({
        cardId: new Types.ObjectId(item.cardId),
      });

      // Last-write-wins: an offline client may resubmit a batch that's
      // already been applied by a newer review — never let an older `at`
      // clobber a more recent one.
      if (existing?.lastReview && existing.lastReview.getTime() >= item.at.getTime()) {
        skipped++;
        continue;
      }

      const currentFields = existing ? toReviewStateFields(existing) : null;
      const nextFields = applyReviewGrade(currentFields, item.grade, item.at);

      await this.reviewStateModel.findOneAndUpdate(
        { cardId: new Types.ObjectId(item.cardId) },
        { cardId: new Types.ObjectId(item.cardId), ...nextFields },
        { upsert: true, setDefaultsOnInsert: true },
      );

      await this.reviewLogModel.create({
        cardId: new Types.ObjectId(item.cardId),
        packId: new Types.ObjectId(item.packId),
        grade: item.grade,
        tookMs: item.tookMs,
        at: item.at,
      });

      applied++;
    }

    return { applied, skipped };
  }
}
