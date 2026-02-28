import type { ExtractedConversation, Message } from "./types";

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
  // ChatGPT shows model name in various places — try common selectors
  const modelButton = document.querySelector('[data-testid="model-switcher-dropdown-button"]');
  if (modelButton?.textContent) {
    model = modelButton.textContent.trim();
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
