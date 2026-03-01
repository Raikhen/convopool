import type { ExtractedConversation, ConversationPayload, Platform } from "./types";

const EXTENSION_VERSION = "1.0.0";
const DEFAULT_SHARE_TEXT = "Share this conversation";

const consentView = document.getElementById("consent-view")!;
const shareView = document.getElementById("share-view")!;
const consentBtn = document.getElementById("consent-btn") as HTMLButtonElement;
const shareBtn = document.getElementById("share-btn") as HTMLButtonElement;
const errorStatus = document.getElementById("error-status")!;
const noChatMsg = document.getElementById("no-chat-msg")!;

function detectPlatform(url: string): Platform | null {
  try {
    const u = new URL(url);
    if (u.hostname === "chatgpt.com" || u.hostname === "chat.openai.com") return "chatgpt";
    if (u.hostname === "claude.ai") return "claude";
    if (u.hostname === "grok.com") return "grok";
    if (u.hostname === "gemini.google.com") return "gemini";
  } catch {}
  return null;
}

// Show share button only on supported pages
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab?.url && detectPlatform(tab.url)) {
    noChatMsg.classList.add("hidden");
    shareBtn.classList.remove("hidden");
  }
});

function showView(toShow: HTMLElement, toHide: HTMLElement) {
  toHide.classList.add("fading-out");
  setTimeout(() => {
    toHide.classList.add("hidden");
    toHide.classList.remove("fading-out");
    toShow.classList.remove("hidden");
  }, 250);
}

function setBtnState(text: string, state: "idle" | "loading" | "success") {
  shareBtn.textContent = text;
  shareBtn.classList.remove("loading", "success");
  shareBtn.disabled = state !== "idle";
  if (state !== "idle") {
    shareBtn.classList.add(state);
  }
  errorStatus.classList.add("hidden");
  errorStatus.textContent = "";
}

function showError(text: string) {
  shareBtn.textContent = DEFAULT_SHARE_TEXT;
  shareBtn.classList.remove("loading", "success");
  shareBtn.disabled = false;
  errorStatus.textContent = text;
  errorStatus.classList.remove("hidden");
}

// Check consent state on popup open
chrome.storage.local.get("consented", ({ consented }) => {
  if (consented) {
    consentView.classList.add("hidden");
    shareView.classList.remove("hidden");
  }
});

consentBtn.addEventListener("click", () => {
  chrome.storage.local.set({ consented: true }, () => {
    showView(shareView, consentView);
  });
});

shareBtn.addEventListener("click", async () => {
  setBtnState("Extracting...", "loading");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) {
      showError("No active tab found");
      return;
    }

    const platform = detectPlatform(tab.url);
    if (!platform) return;

    // Inject content script in case it wasn't loaded (e.g. tab predates extension install)
    const scriptMap: Record<Platform, string> = {
      chatgpt: "content.js",
      claude: "content-claude.js",
      grok: "content-grok.js",
      gemini: "content-gemini.js",
    };
    const scriptFile = scriptMap[platform];
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: [scriptFile],
    });

    const data: ExtractedConversation = await chrome.tabs.sendMessage(tab.id, {
      type: "extract-conversation",
    });

    if (!data.turns || data.turns.length === 0) {
      showError("No conversation found on this page");
      return;
    }

    setBtnState(`Sharing ${data.turns.length} messages...`, "loading");

    const payload: ConversationPayload = {
      conversation_id: crypto.randomUUID(),
      platform,
      model: data.model,
      turns: data.turns,
      captured_at: new Date().toISOString(),
      extension_version: EXTENSION_VERSION,
    };

    const response = await chrome.runtime.sendMessage({
      type: "upload-conversation",
      payload,
    });

    if (response?.success) {
      setBtnState("Shared! Thank you.", "success");
      setTimeout(() => setBtnState(DEFAULT_SHARE_TEXT, "idle"), 3000);
    } else {
      showError(response?.error || "Failed to share. Try again.");
    }
  } catch (err) {
    console.error("Share failed:", err);
    showError("Failed \u2014 make sure you're on a supported AI chat");
  }
});