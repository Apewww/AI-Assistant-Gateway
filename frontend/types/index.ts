export interface MessageFile {
  file_id: string
  name: string
  isImage: boolean
  blobUrl: string
}

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  files?: MessageFile[]
  timestamp: number
}

export interface Session {
  id: string
  name: string
  messages: Message[]
  createdAt: number
}

export interface ModelOption {
  id: string
  name: string
  pricing?: Record<string, string>
}

export const REASONING_OPTIONS = ["low", "medium", "high", "max"] as const;
export const REASONING_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  max: "Max",
};

export type ReasoningEffort = (typeof REASONING_OPTIONS)[number];

export const FALLBACK_MODELS: ModelOption[] = [
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash (free)", pricing: { prompt: "0", completion: "0" } },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", pricing: { prompt: "0", completion: "0" } },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku", pricing: { prompt: "0", completion: "0" } },
  { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 70B Instruct", pricing: { prompt: "0", completion: "0" } },
  { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B Instruct", pricing: { prompt: "0", completion: "0" } },
]
