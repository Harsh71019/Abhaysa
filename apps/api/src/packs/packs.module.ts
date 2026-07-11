import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CardEntity, CardSchema } from "../cards/card.schema";
import { DeckEntity, DeckSchema } from "../decks/deck.schema";
import { ReviewStateEntity, ReviewStateSchema } from "../reviews/review-state.schema";
import { PackEntity, PackSchema } from "./pack.schema";
import { PacksController } from "./packs.controller";
import { PacksCronService } from "./packs.cron";
import { PacksService } from "./packs.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PackEntity.name, schema: PackSchema },
      { name: CardEntity.name, schema: CardSchema },
      { name: DeckEntity.name, schema: DeckSchema },
      { name: ReviewStateEntity.name, schema: ReviewStateSchema },
    ]),
  ],
  controllers: [PacksController],
  providers: [PacksService, PacksCronService],
  exports: [PacksService],
})
export class PacksModule {}
