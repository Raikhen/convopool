import type { ExtractedConversation, ConversationPayload } from "./types";

const EXTENSION_VERSION = "0.1.0";

const consentView = document.getElementById("consent-view")!;
const shareView = document.getElementById("share-view")!;
const consentBtn = document.getElementById("consent-btn") as HTMLButtonElement;
const shareBtn = document.getElementById("share-btn") as HTMLButtonElement;
const optOutBtn = document.getElementById("opt-out-btn") as HTMLButtonElement;
const statusEl = document.getElementById("status")!;

function setStatus(text: string, type: "loading" | "success" | "error") {
  statusEl.textContent = text;
  statusEl.className = `status ${type}`;
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "status";
}

// Check consent state on popup open
chrome.storage.local.get("consented", ({ consented }) => {
  if (consented) {
    consentView.style.display = "none";
    shareView.style.display = "block";
  }
});

consentBtn.addEventListener("click", () => {
  chrome.storage.local.set({ consented: true }, () => {
    consentView.style.display = "none";
    shareView.style.display = "block";
  });
});

optOutBtn.addEventListener("click", () => {
  chrome.storage.local.set({ consented: false }, () => {
    shareView.style.display = "none";
    consentView.style.display = "block";
    clearStatus();
  });
});

shareBtn.addEventListener("click", async () => {
  shareBtn.disabled = true;
  setStatus("Extracting conversation...", "loading");

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      setStatus("No active tab found", "error");
      shareBtn.disabled = false;
      return;
    }

    // Ask content script to extract the conversation
    const data: ExtractedConversation = await chrome.tabs.sendMessage(tab.id, {
      type: "extract-conversation",
    });

    if (!data.turns || data.turns.length === 0) {
      setStatus("No conversation found on this page", "error");
      shareBtn.disabled = false;
      return;
    }

    setStatus(`Sharing ${data.turns.length} messages...`, "loading");

    // Build payload
    const payload: ConversationPayload = {
      conversation_id: crypto.randomUUID(),
      platform: "chatgpt",
      model: data.model,
      turns: data.turns,
      captured_at: new Date().toISOString(),
      extension_version: EXTENSION_VERSION,
    };

    // Send to background worker for upload
    const response = await chrome.runtime.sendMessage({
      type: "upload-conversation",
      payload,
    });

    if (response?.success) {
      setStatus("Shared! Thank you for contributing.", "success");
    } else {
      setStatus(response?.error || "Failed to share. Will retry later.", "error");
    }
  } catch (err) {
    console.error("Share failed:", err);
    setStatus("Failed — make sure you're on a ChatGPT page", "error");
  } finally {
    shareBtn.disabled = false;
  }
});
