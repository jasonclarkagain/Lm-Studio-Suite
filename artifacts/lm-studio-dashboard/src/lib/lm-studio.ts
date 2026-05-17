export const DEFAULT_URL = "http://localhost:1234";
export const STORAGE_KEY = "lm_studio_url";

export function getServerUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setServerUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ""));
}

export interface LMModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelsResponse {
  object: string;
  data: LMModel[];
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

export async function fetchModels(): Promise<ModelsResponse> {
  const url = getServerUrl();
  const res = await fetch(`${url}/v1/models`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function testConnection(): Promise<boolean> {
  try {
    await fetchModels();
    return true;
  } catch {
    return false;
  }
}

export async function* streamChatCompletion(
  request: ChatCompletionRequest,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const url = getServerUrl();
  const res = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: true }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed
        }
      }
    }
  }
}

export async function chatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const url = getServerUrl();
  const res = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...request, stream: false }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}
