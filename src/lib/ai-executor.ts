"use server";

import { GoogleGenAI, Type } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-3.8-flash";

const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ?? "gemini-3.7-flash";

export type AIExecutorInput = {
  system?: string;
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

export type AIExecutorResult = {
  text: string;
  model: string;
  durationMs: number;
};

function getGeminiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isQuotaError(error: unknown): boolean {
  const message = getGeminiErrorMessage(error);

  return (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("quota exceeded") ||
    message.includes("generate_content_free_tier_requests")
  );
}

function isTemporaryUnavailableError(error: unknown): boolean {
  const message = getGeminiErrorMessage(error);

  return (
    message.includes("503") ||
    message.includes("UNAVAILABLE") ||
    message.includes("high demand")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(
  ai: GoogleGenAI,
  model: string,
  input: AIExecutorInput,
  maxRetries = 2,
): Promise<AIExecutorResult> {
  const startedAt = Date.now();

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Gemini AI] Attempt ${attempt + 1}/${maxRetries + 1} | model=${model}`,
      );

      const response = await ai.models.generateContent({
        model,
        contents: input.prompt,
        config: {
          ...(input.system
            ? {
                systemInstruction: input.system,
              }
            : {}),
          ...(input.temperature !== undefined
            ? {
                temperature: input.temperature,
              }
            : {}),
          maxOutputTokens: input.maxTokens ?? 512,

          responseMimeType: "application/json",

          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: {
                type: Type.STRING,
              },
              priority: {
                type: Type.STRING,
                enum: [
                  "LOW",
                  "MEDIUM",
                  "HIGH",
                  "CRITICAL",
                ],
              },
              delegateTo: {
                type: Type.STRING,
                enum: [
                  "lead_generator",
                  "sales",
                  "project_manager",
                  "ceo",
                ],
              },
              taskType: {
                type: Type.STRING,
              },
              reasoning: {
                type: Type.STRING,
              },
            },
            required: [
              "decision",
              "priority",
              "delegateTo",
              "taskType",
              "reasoning",
            ],
          },
        },
      });

      const text = response.text?.trim() ?? "";

      if (!text) {
        throw new Error(
          "Gemini returned an empty AI response.",
        );
      }

      const durationMs = Date.now() - startedAt;

      console.log(
        `[Gemini AI] Success | model=${model} | duration=${durationMs}ms`,
      );

      console.log(
        `[Gemini AI] Response length=${text.length}`,
      );

      return {
        text,
        model,
        durationMs,
      };
    } catch (error) {
      lastError = error;

      console.error(
        `[Gemini AI] Attempt ${attempt + 1} failed | model=${model}:`,
        error,
      );

      /*
       * A 429 means the current model/project quota is exhausted.
       * Retrying the same model only wastes time and can never fix
       * the quota condition, so immediately bubble it up to the
       * fallback-model logic.
       */
      if (isQuotaError(error)) {
        console.warn(
          `[Gemini AI] Quota exhausted for model=${model}. Skipping retries.`,
        );

        throw error;
      }

      /*
       * 503/high-demand errors are temporary, so retry them with
       * exponential backoff.
       */
      if (
        !isTemporaryUnavailableError(error) ||
        attempt === maxRetries
      ) {
        throw error;
      }

      const delay = 2000 * Math.pow(2, attempt);

      console.log(
        `[Gemini AI] Temporary model unavailability. Retrying in ${delay}ms...`,
      );

      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini AI request failed.");
}

export async function executeLocalAI(
  input: AIExecutorInput,
): Promise<AIExecutorResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not configured.",
    );
  }

  const ai = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

  console.log(
    `[Gemini AI] Starting request | primary=${GEMINI_MODEL} | fallback=${GEMINI_FALLBACK_MODEL}`,
  );

  try {
    return await generateWithRetry(
      ai,
      GEMINI_MODEL,
      input,
      2,
    );
  } catch (primaryError) {
    console.error(
      `[Gemini AI] Primary model failed: ${GEMINI_MODEL}`,
      primaryError,
    );

    if (GEMINI_FALLBACK_MODEL === GEMINI_MODEL) {
      throw new Error(
        `Gemini AI request failed: ${
          primaryError instanceof Error
            ? primaryError.message
            : "unknown error"
        }`,
      );
    }

    console.log(
      `[Gemini AI] Switching immediately to fallback model: ${GEMINI_FALLBACK_MODEL}`,
    );

    try {
      return await generateWithRetry(
        ai,
        GEMINI_FALLBACK_MODEL,
        input,
        2,
      );
    } catch (fallbackError) {
      console.error(
        `[Gemini AI] Fallback model failed: ${GEMINI_FALLBACK_MODEL}`,
        fallbackError,
      );

      throw new Error(
        `Gemini AI request failed: ${
          fallbackError instanceof Error
            ? fallbackError.message
            : "unknown error"
        }`,
      );
    }
  }
}