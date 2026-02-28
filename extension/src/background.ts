import type { ConversationPayload } from "./types";

const BACKEND_URL = "https://YOUR-SPACE.hf.space"; // TODO: replace with actual HF Space URL
const API_KEY = "TODO_REPLACE_WITH_API_KEY"; // TODO: replace or load from storage

async function uploadConversation(payload: ConversationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Try to drain the retry queue on success
      drainRetryQueue();
      return { success: true };
    }

    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  } catch (err) {
    // Queue for retry
    await queueForRetry(payload);
    return { success: false, error: String(err) };
  }
}

async function queueForRetry(payload: ConversationPayload): Promise<void> {
  const { retryQueue = [] } = await chrome.storage.local.get("retryQueue");
  retryQueue.push(payload);
  // Cap at 100 queued conversations
  if (retryQueue.length > 100) {
    retryQueue.shift();
  }
  await chrome.storage.local.set({ retryQueue });
  console.log(`Queued for retry (${retryQueue.length} in queue)`);
}

async function drainRetryQueue(): Promise<void> {
  const { retryQueue = [] } = await chrome.storage.local.get("retryQueue");
  if (retryQueue.length === 0) return;

  console.log(`Draining retry queue (${retryQueue.length} items)`);
  const remaining: ConversationPayload[] = [];

  for (const payload of retryQueue) {
    try {
      const response = await fetch(`${BACKEND_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        remaining.push(payload);
      }
    } catch {
      remaining.push(payload);
      break; // Stop trying if we're failing
    }
  }

  await chrome.storage.local.set({ retryQueue: remaining });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "upload-conversation") {
    uploadConversation(message.payload).then(sendResponse);
    return true; // Keep message channel open for async response
  }
});
