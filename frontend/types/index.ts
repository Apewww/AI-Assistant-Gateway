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
