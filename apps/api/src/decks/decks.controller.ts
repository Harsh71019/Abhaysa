import { Controller, Get, Param } from "@nestjs/common";
import type { Deck } from "@local/shared";
import { DecksService } from "./decks.service";

@Controller("decks")
export class DecksController {
  constructor(private readonly decksService: DecksService) {}

  @Get()
  findAll(): Promise<Deck[]> {
    return this.decksService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string): Promise<Deck> {
    return this.decksService.findById(id);
  }
}
