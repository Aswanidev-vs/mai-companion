import type { Env } from "../types/index.ts";

export function validateEnv(env: Env): void {
  const required = [
    "GEMINI_API_KEY",
    "GITHUB_APP_ID",
    "GITHUB_PRIVATE_KEY",
    "GITHUB_WEBHOOK_SECRET",
  ] as const;

  for (const key of required) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
