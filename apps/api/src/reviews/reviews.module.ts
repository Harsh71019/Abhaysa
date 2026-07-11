import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ReviewLogEntity, ReviewLogSchema } from "./review-log.schema";
import { ReviewStateEntity, ReviewStateSchema } from "./review-state.schema";
import { ReviewsController } from "./reviews.controller";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewStateEntity.name, schema: ReviewStateSchema },
      { name: ReviewLogEntity.name, schema: ReviewLogSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
