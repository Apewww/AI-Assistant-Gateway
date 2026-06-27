export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
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
}

export const AVAILABLE_MODELS: ModelOption[] = [
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
  { id: "meta-llama/llama-3-70b-instruct", name: "Llama 3 70B" },
  { id: "mistralai/mistral-7b-instruct", name: "Mistral 7B" },
]
