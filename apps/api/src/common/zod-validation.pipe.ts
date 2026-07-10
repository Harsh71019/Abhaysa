import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/**
 * Validates a controller argument (body/query/param) against a zod schema
 * from packages/shared. Use per-route: @Body(new ZodValidationPipe(schema)).
 * Every request/response shape is a zod schema — this is the request-side
 * enforcement of that rule; LLM output validation (services/llm) is separate.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }
}
