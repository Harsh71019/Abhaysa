import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { z } from "zod";
import {
  createSourceSchema,
  sourceStatusSchema,
  type CreateSourceInput,
  type Source,
  type SourceStatus,
} from "@local/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SourcesService } from "./sources.service";

const findAllQuerySchema = z.object({
  status: sourceStatusSchema.optional(),
});

@Controller("sources")
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(findAllQuerySchema)) query: { status?: SourceStatus },
  ): Promise<Source[]> {
    return this.sourcesService.findAll(query.status);
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<Source> {
    return this.sourcesService.findById(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createSourceSchema)) input: CreateSourceInput,
  ): Promise<Source> {
    return this.sourcesService.create(input);
  }
}
