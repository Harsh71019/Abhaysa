import { FSRS, generatorParameters, type FSRSParameters } from "ts-fsrs";

/**
 * Single source of truth for FSRS tuning. Both the API (server-authoritative
 * scheduling on /reviews/batch) and the web client (offline scheduling on the
 * train, synced later) must construct their scheduler from this file so the
 * two never drift.
 */
export const fsrsParameters: FSRSParameters = generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
});

export function createScheduler(): FSRS {
  return new FSRS(fsrsParameters);
}
