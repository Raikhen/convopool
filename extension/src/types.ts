export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ExtractedConversation {
  turns: Message[];
  model?: string;
}

export type Platform = "chatgpt" | "claude" | "grok" | "gemini";

export interface ConversationPayload {
  conversation_id: string;
  platform: Platform;
  model?: string;
  turns: Message[];
  captured_at: string;
  extension_version: string;
}
