import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { createCardSchema, type Card, type CreateCardInput } from "@local/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CardsService } from "./cards.service";

@Controller("cards")
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  findAll(@Query("deckId") deckId?: string): Promise<Card[]> {
    return this.cardsService.findAll(deckId);
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<Card> {
    return this.cardsService.findById(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(createCardSchema)) input: CreateCardInput): Promise<Card> {
    return this.cardsService.create(input);
  }
}
