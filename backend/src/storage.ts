import { uploadFiles } from "@huggingface/hub";
import { config } from "./config";
import type { EnrichedConversation } from "./types";

export async function uploadConversation(conversation: EnrichedConversation): Promise<void> {
  const filename = `conv_${conversation.conversation_id}_${Date.now()}.jsonl`;
  const content = JSON.stringify(conversation) + "\n";

  await uploadFiles({
    repo: { type: "dataset", name: config.HF_REPO_ID },
    accessToken: config.HF_TOKEN,
    files: [{ path: `data/${filename}`, content: new Blob([content]) }],
  });
}
