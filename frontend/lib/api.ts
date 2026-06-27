function getApiBase(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    return `http://${hostname}:8000`;
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export interface ApiChatRequest {
  session_id: string;
  source_platform: string;
  message: string;
  model?: string;
}

export interface ActionTrigger {
  target_service: string;
  command: string;
  parameters: Record<string, unknown>;
}

export interface ApiChatResponse {
  session_id: string;
  response_type: "text" | "action";
  content: string;
  action_triggered: ActionTrigger | null;
}

export interface StreamEvents {
  onText?: (text: string) => void;
  onToolCall?: (name: string, args: unknown) => void;
  onDone?: (model: string) => void;
  onError?: (message: string) => void;
}

export async function sendMessage(
  req: ApiChatRequest,
  signal?: AbortSignal,
): Promise<ApiChatResponse> {
  const res = await fetch(`${getApiBase()}/api/v1/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (res.status === 429) {
    throw new Error(
      "Rate limit exceeded. Please wait a moment before trying again.",
    );
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(detail.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function sendMessageStream(
  req: ApiChatRequest,
  events: StreamEvents,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${getApiBase()}/api/v1/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
    signal,
  });

  if (res.status === 429) {
    throw new Error(
      "Rate limit exceeded. Please wait a moment before trying again.",
    );
  }

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(detail.detail || `HTTP ${res.status}`);
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
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "text") events.onText?.(data.content);
        else if (data.type === "tool_call") events.onToolCall?.(data.name, data.args);
        else if (data.type === "done") events.onDone?.(data.model || "");
        else if (data.type === "error") events.onError?.(data.message);
      } catch {
        // skip malformed JSON
      }
    }
  }
}
