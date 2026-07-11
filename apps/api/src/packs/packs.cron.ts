import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PacksService } from "./packs.service";

@Injectable()
export class PacksCronService {
  constructor(private readonly packsService: PacksService) {}

  /** BACKEND_PLAN.md §6.4: nightly pack build at 05:30 IST. */
  @Cron("30 5 * * *", { timeZone: "Asia/Kolkata" })
  async generateMorningPack(): Promise<void> {
    await this.packsService.generateForToday("morning");
  }
}
