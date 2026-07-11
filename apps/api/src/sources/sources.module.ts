import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DecksModule } from "../decks/decks.module";
import { SourceEntity, SourceSchema } from "./source.schema";
import { ExtractionService } from "./extraction.service";
import { SourcesService } from "./sources.service";
import { SourcesController } from "./sources.controller";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SourceEntity.name, schema: SourceSchema }]),
    DecksModule,
  ],
  controllers: [SourcesController],
  providers: [ExtractionService, SourcesService],
  exports: [SourcesService],
})
export class SourcesModule {}
