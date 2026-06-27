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
