import "reflect-metadata";
import mongoose from "mongoose";
import { attentionDeck, attentionCards } from "@local/shared";
import { DeckEntity, DeckSchema } from "../decks/deck.schema";
import { CardEntity, CardSchema } from "../cards/card.schema";

async function main(): Promise<void> {
  const uri = process.env["MONGODB_URI"] ?? "mongodb://localhost:27017/local";
  // Standalone MongoDB (no replica set) doesn't support retryable writes.
  await mongoose.connect(uri, { retryWrites: false });

  const DeckModel = mongoose.model(DeckEntity.name, DeckSchema);
  const CardModel = mongoose.model(CardEntity.name, CardSchema);

  const { _id: deckId, ...deckFields } = attentionDeck;
  await DeckModel.findByIdAndUpdate(deckId, deckFields, {
    upsert: true,
    setDefaultsOnInsert: true,
  });

  await CardModel.deleteMany({ deckId });
  await CardModel.insertMany(attentionCards);

  console.log(`Seeded deck "${attentionDeck.title}" (${deckId}) with ${attentionCards.length} cards.`);

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
