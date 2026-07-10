import { z } from "zod";

/**
 * Every env var the API needs, validated once at boot. A malformed .env
 * fails fast at startup instead of surfacing as a confusing runtime error
 * three requests later (e.g. a missing ANTHROPIC_API_KEY during card gen).
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),

  MONGODB_URI: z.string().min(1),

  AUTH_EMAIL: z.string().email(),
  AUTH_PASSWORD_HASH: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  ANTHROPIC_API_KEY: z.string().min(1),
  VOYAGE_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
