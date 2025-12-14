export type ORChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
  reasoning_details?: unknown;
};

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

type OpenRouterResponse = {
  id: string;
  object: string;
  choices: Array<{
    index: number;
    message?: ORChatMessage;
    finish_reason?: string;
  }>;
};

export async function callOpenRouter(messages: ORChatMessage[]) {
  if (!API_KEY) {
    throw new Error("Missing `VITE_OPENROUTER_API_KEY`. Set this in your environment.");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        messages,
        reasoning: { enabled: true },
      }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Chatbot request failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as OpenRouterResponse;
  const choice = payload.choices?.[0];
  if (!choice || !choice.message) {
    throw new Error("OpenRouter returned no message.");
  }
  return choice.message;
}
