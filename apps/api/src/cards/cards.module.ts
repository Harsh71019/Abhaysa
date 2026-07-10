import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CardEntity, CardSchema } from "./card.schema";
import { CardsService } from "./cards.service";
import { CardsController } from "./cards.controller";

@Module({
  imports: [MongooseModule.forFeature([{ name: CardEntity.name, schema: CardSchema }])],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
