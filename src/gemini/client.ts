import type { GeminiResponse } from "../types/index.ts";
import { logger } from "../utils/logger.ts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface GenerateOptions {
  prompt: string;
  search?: boolean;
  systemInstruction?: string;
  temperature?: number;
}

export async function generateContent(
  apiKey: string,
  promptOrOptions: string | GenerateOptions
): Promise<string> {
  const opts =
    typeof promptOrOptions === "string"
      ? { prompt: promptOrOptions, search: false }
      : promptOrOptions;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: 2048,
    },
  };

  if (opts.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: opts.systemInstruction }],
    };
  }

  if (opts.search) {
    body.tools = [{ google_search: {} }];
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn("Gemini rate limited, retrying", { attempt, delay });
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Gemini API error: ${response.status} ${body}`);
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }

      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn("Gemini request failed, retrying", { attempt, delay, error: lastError.message });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("Gemini request failed after retries");
}
