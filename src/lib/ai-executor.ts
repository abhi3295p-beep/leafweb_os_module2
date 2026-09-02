"use server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:4b";

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

export async function executeLocalAI(
  input: AIExecutorInput,
): Promise<AIExecutorResult> {
  const startedAt = Date.now();
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? 120000,
  );

  let response: Response;

  try {
    response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        think: false,
        format: "json",
        messages: [
          ...(input.system
            ? [{ role: "system", content: input.system }]
            : []),
          {
            role: "user",
            content: input.prompt,
          },
        ],
        options: {
          temperature: input.temperature ?? 0.2,
          num_predict: input.maxTokens ?? 128,
        },
      }),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Local AI request timed out.");
    }

    throw new Error(
      "Local AI is unavailable. Ollama must be running and reachable from the application server.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();

  console.log(
    "OLLAMA RESPONSE:",
    JSON.stringify(data),
  );

  const text =
    data?.message?.content ??
    data?.response ??
    "";

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Ollama returned an empty AI response.");
  }

  return {
    text: text.trim(),
    model: OLLAMA_MODEL,
    durationMs: Date.now() - startedAt,
  };
}
