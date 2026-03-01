import type { ExtractedConversation, Message } from "./types";

function cleanModelName(raw: string): string {
  return raw
    .trim()
    .replace(/^(Model:\s*|Using\s+)/i, "")
    .slice(0, 100)
    .trim();
}

function extractConversation(): ExtractedConversation {
  const turns: Message[] = [];

  // ChatGPT uses article elements with data-testid="conversation-turn-N"
  const articles = document.querySelectorAll('article[data-testid^="conversation-turn-"]');

  articles.forEach((article, index) => {
    // Even indices (0, 2, 4...) are user turns, odd are assistant
    const role: Message["role"] = index % 2 === 0 ? "user" : "assistant";

    // Extract text content from the message area
    const messageDiv = article.querySelector('[data-message-author-role]');
    if (messageDiv) {
      const authorRole = messageDiv.getAttribute('data-message-author-role');
      const content = messageDiv.querySelector('.markdown, .whitespace-pre-wrap');
      if (content) {
        turns.push({
          role: (authorRole === "user" ? "user" : "assistant") as Message["role"],
          content: content.textContent?.trim() || "",
        });
        return;
      }
    }

    // Fallback: grab all text from the article
    const content = article.textContent?.trim() || "";
    if (content) {
      turns.push({ role, content });
    }
  });

  // Try to detect model name from the UI
  let model: string | undefined;

  // Primary: data-testid selector (may still work for some users)
  const modelButton = document.querySelector('[data-testid="model-switcher-dropdown-button"]');
  if (modelButton?.textContent) {
    model = cleanModelName(modelButton.textContent);
  }

  // Fallback: scan for per-message "Used GPT-X" labels below assistant messages
  if (!model) {
    const allElements = Array.from(document.querySelectorAll('article [data-message-author-role="assistant"] ~ *, article span, article div'));
    for (const el of allElements) {
      const match = el.textContent?.match(/Used\s+(GPT-[\w.-]+)/i);
      if (match) {
        model = cleanModelName(match[1]);
        break;
      }
    }
  }

  // Fallback: check URL for ?model= parameter
  if (!model) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlModel = urlParams.get("model");
    if (urlModel) {
      model = cleanModelName(urlModel);
    }
  }

  return { turns, model };
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "extract-conversation") {
    const data = extractConversation();
    sendResponse(data);
  }
  return true; // Keep message channel open for async response
});
