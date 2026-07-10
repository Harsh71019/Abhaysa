import { Controller, Get } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";

@Controller("health")
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check(): { status: "ok"; mongo: "connected" | "connecting" | "disconnected" } {
    const mongoStateByReadyState: Record<number, "connected" | "connecting" | "disconnected"> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnected",
    };
    const mongo = mongoStateByReadyState[this.connection.readyState] ?? "disconnected";
    return { status: "ok", mongo };
  }
}
