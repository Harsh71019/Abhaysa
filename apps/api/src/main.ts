import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import helmet from "@fastify/helmet";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import type { Env } from "./config/env.schema";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(helmet);
  // Single-user personal app (no multi-tenant auth story) — the web PWA is
  // served from a different origin/port than the API, so allow any origin
  // rather than hardcoding the Tailscale IP, which can change.
  app.enableCors();

  const configService = app.get(ConfigService<Env, true>);
  const port = configService.get("PORT", { infer: true });

  await app.listen(port, "0.0.0.0");
}

void bootstrap();
