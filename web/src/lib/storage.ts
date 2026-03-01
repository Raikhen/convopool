import { uploadFiles, downloadFile, listCommits } from "@huggingface/hub";
import { getConfig } from "./config";
import type { EnrichedConversation } from "./types";

const DATA_PATH = "data/train.jsonl";
const MAX_RETRIES = 3;

export async function uploadConversation(conversation: EnrichedConversation): Promise<void> {
  const config = getConfig();
  const newLine = JSON.stringify(conversation) + "\n";
  const repo = { type: "dataset" as const, name: config.HF_REPO_ID };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Get latest commit OID for optimistic locking
    let parentCommit: string | undefined;
    for await (const commit of listCommits({ repo, accessToken: config.HF_TOKEN })) {
      parentCommit = commit.oid;
      break;
    }

    // Fetch existing file and append
    let existing = "";
    try {
      const file = await downloadFile({ repo, path: DATA_PATH, accessToken: config.HF_TOKEN });
      if (file) {
        existing = await file.text();
      }
    } catch (err: unknown) {
      // Only treat 404/not-found as "start fresh" — re-throw other errors
      if (isNotFoundError(err)) {
        // File doesn't exist yet, start fresh
      } else {
        throw err;
      }
    }

    try {
      await uploadFiles({
        repo,
        accessToken: config.HF_TOKEN,
        parentCommit,
        files: [{ path: DATA_PATH, content: new Blob([existing + newLine]) }],
      });
      return; // Success
    } catch (err: unknown) {
      const isConflict = err instanceof Error && /outdated|conflict|behind/i.test(err.message);
      if (isConflict && attempt < MAX_RETRIES - 1) {
        console.warn(`Upload conflict (attempt ${attempt + 1}/${MAX_RETRIES}), retrying...`);
        continue;
      }
      throw err;
    }
  }
}

function isNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /not found|404|does not exist/i.test(err.message);
}
