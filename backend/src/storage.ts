import { uploadFiles, downloadFile } from "@huggingface/hub";
import { config } from "./config.js";
import type { EnrichedConversation } from "./types.js";

const DATA_PATH = "data/train.jsonl";

export async function uploadConversation(conversation: EnrichedConversation): Promise<void> {
  const newLine = JSON.stringify(conversation) + "\n";
  const repo = { type: "dataset" as const, name: config.HF_REPO_ID };

  // Fetch existing file and append
  let existing = "";
  try {
    const file = await downloadFile({ repo, path: DATA_PATH, accessToken: config.HF_TOKEN });
    if (file) {
      existing = await file.text();
    }
  } catch {
    // File doesn't exist yet, start fresh
  }

  await uploadFiles({
    repo,
    accessToken: config.HF_TOKEN,
    files: [{ path: DATA_PATH, content: new Blob([existing + newLine]) }],
  });
}
