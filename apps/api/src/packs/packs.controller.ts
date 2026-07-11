import { Controller, Get, Post, Query } from "@nestjs/common";
import { z } from "zod";
import { packLegSchema, type Pack, type PackBundle, type PackLeg } from "@local/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { PacksService } from "./packs.service";

const legQuerySchema = z.object({
  leg: packLegSchema.default("morning"),
});

@Controller("packs")
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Get("today")
  getToday(
    @Query(new ZodValidationPipe(legQuerySchema)) query: { leg: PackLeg },
  ): Promise<PackBundle> {
    return this.packsService.getTodayBundle(query.leg);
  }

  @Post("generate")
  generate(@Query(new ZodValidationPipe(legQuerySchema)) query: { leg: PackLeg }): Promise<Pack> {
    return this.packsService.generateForToday(query.leg);
  }
}
