import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DeckEntity, DeckSchema } from "./deck.schema";
import { DecksService } from "./decks.service";
import { DecksController } from "./decks.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: DeckEntity.name, schema: DeckSchema }])],
  controllers: [DecksController],
  providers: [DecksService],
  exports: [DecksService],
})
export class DecksModule {}
