import { Body, Controller, Post } from "@nestjs/common";
import { reviewBatchSchema, type ReviewBatch, type ReviewBatchResponse } from "@local/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post("batch")
  applyBatch(
    @Body(new ZodValidationPipe(reviewBatchSchema)) batch: ReviewBatch,
  ): Promise<ReviewBatchResponse> {
    return this.reviewsService.applyBatch(batch);
  }
}
