"use server";

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:4b";

export type AIExecutorInput = {
  system?: string;
  prompt: string;
  temperature?: number;
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
        },
      }),
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Local AI is unavailable. Ollama must be running and reachable from the application server.",
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`,
    );
  }

  const data = await response.json();
  const text = data?.message?.content;

  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Ollama returned an empty AI response.");
  }

  return {
    text: text.trim(),
    model: OLLAMA_MODEL,
    durationMs: Date.now() - startedAt,
  };
}
