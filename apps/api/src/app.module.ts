import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "./config/config.module";
import { EnvService } from "./config/env.service";
import { HealthModule } from "./health/health.module";
import { DecksModule } from "./decks/decks.module";
import { CardsModule } from "./cards/cards.module";

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
    HealthModule,
    DecksModule,
    CardsModule,
  ],
})
export class AppModule {}
