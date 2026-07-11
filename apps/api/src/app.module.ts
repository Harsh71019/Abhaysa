import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { ConfigModule } from "./config/config.module";
import { EnvService } from "./config/env.service";
import { HealthModule } from "./health/health.module";
import { DecksModule } from "./decks/decks.module";
import { CardsModule } from "./cards/cards.module";
import { PacksModule } from "./packs/packs.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { SourcesModule } from "./sources/sources.module";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [EnvService],
      useFactory: (env: EnvService) => ({
        uri: env.get("MONGODB_URI"),
        // Deploy target is a standalone MongoDB instance (no replica set),
        // which doesn't support retryable writes.
        retryWrites: false,
      }),
    }),
    ScheduleModule.forRoot(),
    HealthModule,
    DecksModule,
    CardsModule,
    PacksModule,
    ReviewsModule,
    SourcesModule,
  ],
})
export class AppModule {}
