export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ExtractedConversation {
  turns: Message[];
  model?: string;
}

export interface ConversationPayload {
  conversation_id: string;
  platform: "chatgpt";
  model?: string;
  turns: Message[];
  captured_at: string;
  extension_version: string;
}
